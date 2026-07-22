-- Phase 2-A · 0008 — proposal_submissions 확장 + RLS 개편
-- 목적: 역제안 제출을 회원 인플루언서/캠페인·제품 타겟과 연결. 기존 비회원(anon) 제출 호환 유지.
-- 의존: 0004(influencers), 0005(products), 0006(campaigns), 0007(campaign_applications).
--       0003(third_party_consent) 적용 전제.

-- ── 컬럼 추가 ────────────────────────────────────────────────────────────────
alter table public.proposal_submissions
  add column if not exists influencer_id  uuid references public.influencers (id) on delete set null,   -- nullable(비회원 호환)
  add column if not exists target_type    text not null default 'general' check (target_type = any (array['campaign','product','general'])),
  add column if not exists campaign_id     uuid references public.campaigns (id) on delete set null,
  add column if not exists product_id      uuid references public.products (id) on delete set null,
  add column if not exists application_id  uuid references public.campaign_applications (id) on delete set null,
  add column if not exists ship_recipient  text,
  add column if not exists ship_phone      text,
  add column if not exists ship_address    text;

-- platform CHECK에 'tiktok' 추가
alter table public.proposal_submissions drop constraint if exists proposal_submissions_platform_check;
alter table public.proposal_submissions
  add constraint proposal_submissions_platform_check
  check (platform = any (array['instagram','youtube','tiktok']));

comment on column public.proposal_submissions.target_type is 'campaign | product | general — 역제안 진입점 구분';

-- ── RLS 추가 (기존 anon insert 정책은 유지 — 건드리지 않음) ───────────────────
-- proposal_submissions는 이미 RLS enabled. 아래 정책만 추가.

-- 대상 브랜드: 자기 캠페인/제품으로 온 제안 조회
drop policy if exists proposals_select_target_brand on public.proposal_submissions;
create policy proposals_select_target_brand on public.proposal_submissions for select
  to authenticated
  using (
    (campaign_id is not null and exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid()))
    or (product_id is not null and exists (select 1 from public.products p where p.id = product_id and p.brand_id = auth.uid()))
  );

-- 인플루언서: 본인 제출 조회
drop policy if exists proposals_select_influencer on public.proposal_submissions;
create policy proposals_select_influencer on public.proposal_submissions for select
  to authenticated
  using (influencer_id = auth.uid());

-- 회원 인플루언서: 본인 제출 생성 + 동의 체크
drop policy if exists proposals_insert_influencer on public.proposal_submissions;
create policy proposals_insert_influencer on public.proposal_submissions for insert
  to authenticated
  with check (influencer_id = auth.uid() and privacy_consent = true and third_party_consent = true);
