-- Phase 3-(b)-2 · 0017 — 캠페인 지원자 패널의 인플루언서 공개 프로필 조인
-- 목적: 브랜드는 campaign_applications는 select 가능(자기 캠페인)하지만 influencers는
--       본인만 select(0004 RLS)라 조인이 막힘 → definer로 지원자의 공개 프로필(활동명·
--       채널 인증 여부)만 안전 노출(인박스의 ✓ 뱃지와 동일 기준). PII·토큰은 미노출.
-- 의존: 0004(influencers RLS). 적용은 운영자(MCP read-only).

create or replace function public.get_campaign_applicant_profiles(p_campaign_id uuid)
returns table (influencer_id uuid, display_name text, verified boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.id as influencer_id,
    i.display_name,
    -- 채널 중 하나라도 verified=true면 인증(플랫폼 무관 — 패널은 계정 단위 표시)
    coalesce(
      exists (
        select 1 from jsonb_array_elements(coalesce(i.channels, '[]'::jsonb)) ch
        where (ch->>'verified')::boolean is true
      ), false
    ) as verified
  from public.influencers i
  where
    -- 이 캠페인의 지원자 && 캠페인이 호출 브랜드 소유일 때만
    exists (select 1 from public.campaign_applications a where a.influencer_id = i.id and a.campaign_id = p_campaign_id)
    and exists (select 1 from public.campaigns c where c.id = p_campaign_id and c.brand_id = auth.uid());
$$;

revoke execute on function public.get_campaign_applicant_profiles(uuid) from public, anon;
grant execute on function public.get_campaign_applicant_profiles(uuid) to authenticated;
