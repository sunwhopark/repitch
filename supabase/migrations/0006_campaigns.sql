-- Phase 2-A · 0006 — campaigns 테이블 + 인플루언서 노출용 definer 함수
-- 목적: 브랜드 캠페인(위저드 6단계 확정안). 역제안 진입점 "캠페인 경유"의 대상.
-- 의존: 0005(products). product_id는 nullable(위저드에서 제품 미연결 생성 허용).

create table if not exists public.campaigns (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  brand_id          uuid not null references public.brands (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,   -- nullable
  -- 1 목표·예산
  goal              text,
  budget            int,
  budget_mode       text,                    -- 집중/분산/추천 등 (내부 — 노출 제외)
  -- 2 타겟
  target_ages       text[] not null default '{}',
  target_gender     text,
  target_locales    text[] not null default '{}',
  platforms         text,
  content_types     text[] not null default '{}',
  recruit_count     int,
  -- 3 조건
  follower_ranges   text[] not null default '{}',
  styles            text[] not null default '{}',
  reference_handles text[] not null default '{}',
  desired_vibe      text,
  avoid_note        text,                    -- 내부 메모 — 노출 제외
  -- 4 제공
  offer_type        text check (offer_type = any (array['free','discount'])),
  deal_mode         text check (deal_mode = any (array['amount','percent'])),  -- nullable
  deal_value        int,                     -- nullable
  quantity          int,
  trial_weeks       int,
  -- 5 일정
  recruit_start     date,
  recruit_end       date,
  desired_post_date date,                    -- nullable
  post_date_tbd     boolean not null default false,
  -- 상태
  status            text not null default 'active' check (status = any (array['draft','active','ended']))
);

comment on table public.campaigns is '브랜드 캠페인(위저드 6단계). status=active만 인플루언서에게 노출(get_active_campaigns).';

-- ── RLS: 브랜드 자기 것만 CRUD ───────────────────────────────────────────────
alter table public.campaigns enable row level security;

drop policy if exists campaigns_select_own on public.campaigns;
create policy campaigns_select_own on public.campaigns for select
  to authenticated using (brand_id = auth.uid());

drop policy if exists campaigns_insert_own on public.campaigns;
create policy campaigns_insert_own on public.campaigns for insert
  to authenticated with check (brand_id = auth.uid());

drop policy if exists campaigns_update_own on public.campaigns;
create policy campaigns_update_own on public.campaigns for update
  to authenticated using (brand_id = auth.uid()) with check (brand_id = auth.uid());

drop policy if exists campaigns_delete_own on public.campaigns;
create policy campaigns_delete_own on public.campaigns for delete
  to authenticated using (brand_id = auth.uid());

-- ── 인플루언서 노출: status=active 캠페인의 공개 필드만 ──────────────────────
-- 제외: budget, budget_mode, avoid_note (내부). 포함: 타겟·제공 조건 + 제품명·이미지 + 브랜드명.
create or replace function public.get_active_campaigns()
returns table (
  id                uuid,
  brand_name        text,
  goal              text,
  target_ages       text[],
  target_gender     text,
  target_locales    text[],
  platforms         text,
  content_types     text[],
  recruit_count     int,
  follower_ranges   text[],
  styles            text[],
  reference_handles text[],
  desired_vibe      text,
  offer_type        text,
  deal_mode         text,
  deal_value        int,
  quantity          int,
  trial_weeks       int,
  recruit_start     date,
  recruit_end       date,
  desired_post_date date,
  post_date_tbd     boolean,
  created_at        timestamptz,
  product_id        uuid,
  product_name      text,
  product_image_url text
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
         c.post_date_tbd, c.created_at,
         c.product_id, p.name, p.image_url
  from public.campaigns c
  join public.brands b on b.id = c.brand_id
  left join public.products p on p.id = c.product_id
  where c.status = 'active'
  order by c.created_at desc;
$$;

revoke execute on function public.get_active_campaigns() from public;
grant execute on function public.get_active_campaigns() to authenticated;
