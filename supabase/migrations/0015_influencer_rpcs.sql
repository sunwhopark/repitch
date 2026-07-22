-- Phase 2-D-1 · 0015 — 인플루언서 화면용 정의 함수
-- 1) get_active_campaigns: 카테고리(제품) 필드 추가 + anon 공개(카탈로그 공개 결정).
-- 2) get_my_applications: 인플루언서 본인 지원 목록 + 캠페인/제품/브랜드 공개 정보
--    (campaigns는 브랜드만 select 가능 → 인플루언서가 자기 지원건의 캠페인 표시용).
-- 의존: 0005/0006/0007. 적용은 운영자(MCP read-only).

-- ── get_active_campaigns 재정의(반환 타입 변경이라 drop 후 재생성) ────────────
drop function if exists public.get_active_campaigns();
create function public.get_active_campaigns()
returns table (
  id uuid, brand_name text, goal text, target_ages text[], target_gender text,
  target_locales text[], platforms text, content_types text[], recruit_count int,
  follower_ranges text[], styles text[], reference_handles text[], desired_vibe text,
  offer_type text, deal_mode text, deal_value int, quantity int, trial_weeks int,
  recruit_start date, recruit_end date, desired_post_date date, post_date_tbd boolean,
  created_at timestamptz, product_id uuid, product_name text, product_image_url text,
  product_category text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, b.brand_name, c.goal, c.target_ages, c.target_gender, c.target_locales,
         c.platforms, c.content_types, c.recruit_count, c.follower_ranges, c.styles,
         c.reference_handles, c.desired_vibe, c.offer_type, c.deal_mode, c.deal_value,
         c.quantity, c.trial_weeks, c.recruit_start, c.recruit_end, c.desired_post_date,
         c.post_date_tbd, c.created_at, c.product_id, p.name, p.image_url, p.category
  from public.campaigns c
  join public.brands b on b.id = c.brand_id
  left join public.products p on p.id = c.product_id
  where c.status = 'active'
  order by c.created_at desc;
$$;
-- 공개 카탈로그 — 비로그인(anon)도 탐색 가능.
revoke execute on function public.get_active_campaigns() from public;
grant execute on function public.get_active_campaigns() to authenticated, anon;

-- ── get_my_applications: 인플루언서 본인 지원 목록 ───────────────────────────
create or replace function public.get_my_applications()
returns table (application jsonb, campaign jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select
    to_jsonb(a) as application,
    jsonb_build_object(
      'id', c.id, 'brand_name', b.brand_name, 'status', c.status, 'goal', c.goal,
      'offer_type', c.offer_type, 'deal_mode', c.deal_mode, 'deal_value', c.deal_value,
      'quantity', c.quantity, 'trial_weeks', c.trial_weeks,
      'recruit_start', c.recruit_start, 'recruit_end', c.recruit_end,
      'product_name', p.name, 'product_image_url', p.image_url, 'product_category', p.category
    ) as campaign
  from public.campaign_applications a
  join public.campaigns c on c.id = a.campaign_id
  join public.brands b on b.id = c.brand_id
  left join public.products p on p.id = c.product_id
  where a.influencer_id = auth.uid()
  order by a.created_at desc;
$$;
revoke execute on function public.get_my_applications() from public, anon;
grant execute on function public.get_my_applications() to authenticated;
