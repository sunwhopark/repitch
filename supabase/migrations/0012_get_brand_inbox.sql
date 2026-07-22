-- Phase 2-C · 0012 — get_brand_inbox() 정의 함수
-- 목적: 브랜드 인박스 = 자기 캠페인/제품 대상 proposal + (회원건) influencer 공개 프로필
--       조인. proposal_submissions는 브랜드가 직접 select 가능(0008 RLS)하지만
--       influencers는 본인만 select(0004 RLS)라 조인이 막힘 → definer로 안전하게 노출.
-- 노출 원칙: PII(contact_email·배송지·동의 플래그) 제외, influencer는 공개 프로필만.
-- 의존: 0004/0005/0006/0007/0008. 적용은 운영자(MCP read-only).

create or replace function public.get_brand_inbox()
returns table (proposal jsonb, influencer jsonb, trial_started_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    -- PII·동의 플래그 제거한 제안 본문(점수·표시에 필요한 필드만 남김)
    (to_jsonb(p)
      - 'contact_email' - 'privacy_consent' - 'consent_at' - 'third_party_consent'
      - 'ship_recipient' - 'ship_phone' - 'ship_address') as proposal,
    -- 회원 제출건: 인플루언서 공개 프로필(필터·표시용). 비회원건은 null.
    case when i.id is not null then jsonb_build_object(
      'id', i.id,
      'display_name', i.display_name,
      'creator_type', i.creator_type,
      'gender', i.gender,
      'countries', i.countries,
      'channels', i.channels
    ) else null end as influencer,
    -- 체험 시작 시각(C1 체험기간): 캠페인 지원건의 수령/발송/선정 시각.
    coalesce(a.delivered_at, a.shipped_at, a.selected_at) as trial_started_at
  from public.proposal_submissions p
  left join public.influencers i on i.id = p.influencer_id
  left join public.campaign_applications a on a.id = p.application_id
  where
    (p.campaign_id is not null and exists (select 1 from public.campaigns c  where c.id  = p.campaign_id and c.brand_id  = auth.uid()))
    or (p.product_id is not null and exists (select 1 from public.products  pr where pr.id = p.product_id  and pr.brand_id = auth.uid()));
$$;

revoke execute on function public.get_brand_inbox() from public, anon;
grant execute on function public.get_brand_inbox() to authenticated;
