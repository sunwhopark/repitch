# Re:Pitch 실서비스 스키마 (Phase 2-A)

실서비스 데이터 척추. 마이그레이션 `supabase/migrations/0002`~`0009`로 구성.
Phase 2-B 이후 화면 연결의 참조 문서.

## 계정 모델

- **brands** — 브랜드 계정(Auth, 승인제 `approved`). `0002`.
- **influencers** — 인플루언서 계정(Auth, 즉시 가입, 승인 개념 없음). `0004`.
- 가입 트리거 `handle_new_user`가 `user_metadata.role`로 분기:
  `'influencer'` → `influencers`, 그 외(`'brand'`/null) → `brands`.

## 테이블 관계 (텍스트)

```
auth.users ─┬─(role=brand)──────▶ brands (id = auth.users.id)
            └─(role=influencer)─▶ influencers (id = auth.users.id)

brands 1───∞ products        (products.brand_id → brands.id)
brands 1───∞ campaigns       (campaigns.brand_id → brands.id)
products 1──∞ campaigns      (campaigns.product_id → products.id, nullable)

campaigns 1──∞ campaign_applications   (.campaign_id → campaigns.id)
influencers 1─∞ campaign_applications  (.influencer_id → influencers.id)
        └ unique(campaign_id, influencer_id)  -- 중복 지원 방지

proposal_submissions  (역제안 — 비회원 제출 호환 유지)
   ├ influencer_id  → influencers.id   (nullable)
   ├ campaign_id    → campaigns.id     (nullable)   ┐ target_type =
   ├ product_id     → products.id      (nullable)   ┘ campaign|product|general
   └ application_id → campaign_applications.id (nullable)

decisions  (제안별 브랜드 결정)
   ├ proposal_id → proposal_submissions.id  (UNIQUE — 제안당 1개)
   └ brand_id    → brands.id
```

## 역제안 진입점

1. **캠페인 경유** — `get_active_campaigns()` 노출 → 지원(`campaign_applications`) → 역제안(`proposal_submissions`, target_type='campaign').
2. **입점 제품 직접** — `get_visible_products()` 노출 → 역제안(target_type='product').
3. (하위호환) 비회원 일반 제출 — `target_type='general'`, `influencer_id` null.

## RLS 정책 요약

| 테이블 | 역할 | select | insert | update | delete |
| --- | --- | --- | --- | --- | --- |
| brands | 본인 | ✅ `id=uid` | (트리거) | ✅ `id=uid`* | — |
| influencers | 본인 | ✅ `id=uid` | (트리거) | ✅ `id=uid` | — |
| products | 브랜드(소유) | ✅ `brand_id=uid` | ✅ `brand_id=uid` | ✅ `brand_id=uid` | ✅ `brand_id=uid` |
| campaigns | 브랜드(소유) | ✅ `brand_id=uid` | ✅ `brand_id=uid` | ✅ `brand_id=uid` | ✅ `brand_id=uid` |
| campaign_applications | 인플루언서(본인) | ✅ `influencer_id=uid` | ✅ `influencer_id=uid` + `third_party_consent_at not null` | — | — |
| campaign_applications | 브랜드(캠페인 소유) | ✅ `campaign.brand_id=uid` | — | ✅ `campaign.brand_id=uid`** | — |
| proposal_submissions | anon | — | ✅ (기존 정책 유지) | — | — |
| proposal_submissions | 인플루언서(본인) | ✅ `influencer_id=uid` | ✅ `influencer_id=uid` + `privacy_consent` + `third_party_consent` | — | — |
| proposal_submissions | 브랜드(대상) | ✅ `campaign/product.brand_id=uid` | — | — | — |
| decisions | 브랜드(소유) | ✅ `brand_id=uid` | ✅ `brand_id=uid` | ✅ `brand_id=uid` | — |
| decisions | 인플루언서(해당 제안) | ✅ `proposal.influencer_id=uid` | — | — | — |

- `*` brands.update: `approved`/`approved_at`는 `protect_brand_approval` 트리거가 authenticated에 대해 고정(운영자·service_role만 변경). `0002`.
- `**` applications.update(브랜드): 소유 필드(`influencer_id`·배송지·`third_party_consent_at`·`campaign_id`·`created_at`)는 `protect_application_owner_fields` 트리거가 OLD로 고정 → 브랜드는 상태·송장·보류·타임스탬프만 변경. `0007`.

## SECURITY DEFINER 함수

| 함수 | 목적 | 노출 범위 | EXECUTE |
| --- | --- | --- | --- |
| `handle_new_user()` | 가입 시 role 분기로 brands/influencers 행 생성 | 트리거 전용 | revoke(public/anon/authenticated) |
| `protect_brand_approval()` | brands.approved 잠금(0002) | 트리거 전용 | revoke |
| `protect_application_owner_fields()` | applications 소유 필드 보호 | 트리거 전용 | revoke |
| `touch_updated_at()` | decisions.updated_at 갱신 | 트리거 전용 | revoke |
| `get_visible_products()` | visible 제품 공개 필드(브랜드명 포함, 내부 필드 제외) | 인플루언서 노출 | authenticated |
| `get_active_campaigns()` | active 캠페인 공개 필드(budget·budget_mode·avoid_note 제외, 제품·브랜드 join) | 인플루언서 노출 | authenticated |

- 전 함수 `security definer` + `set search_path = ''` 하드닝.
- `get_*`는 의도된 RPC라 `authenticated` EXECUTE 유지 → advisor의 "Signed-In Users Can Execute SECURITY DEFINER Function"(0029) WARN은 **설계상 정상**(anon은 revoke로 차단).

## 마이그레이션 순서

`0002`(brands)·`0003`(proposal.third_party_consent) → `0004`(influencers+트리거) → `0005`(products) → `0006`(campaigns) → `0007`(applications) → `0008`(proposal 확장) → `0009`(decisions).

> 적용은 운영자가 SQL Editor에서 순서대로 실행(MCP read-only 유지). 적용 후 read-only 조회로 검증.
