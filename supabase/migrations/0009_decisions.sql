-- Phase 2-A · 0009 — decisions 테이블 + updated_at 트리거
-- 목적: 제안에 대한 브랜드 최종 결정(거절/협의/수락). 제안당 1개(갱신 방식).
-- 의존: 0008(proposal_submissions 확장), brands(0002).

create table if not exists public.decisions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  proposal_id       uuid not null unique references public.proposal_submissions (id) on delete cascade,  -- 제안당 1개
  brand_id          uuid not null references public.brands (id) on delete cascade,
  decision          text not null check (decision = any (array['rejected','negotiating','accepted'])),
  reasons           text[] not null default '{}',
  nego_discount_pct int,          -- nullable (협의 시 희망 조정률)
  memo              text
);

comment on table public.decisions is '제안별 브랜드 최종 결정(제안당 unique). 협의 내용은 해당 인플루언서도 조회.';

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists decisions_touch_updated_at on public.decisions;
create trigger decisions_touch_updated_at
  before update on public.decisions
  for each row execute function public.touch_updated_at();

-- ── RLS: 브랜드(자기 것 insert/update/select) / 인플루언서(해당 제안 select) ────
alter table public.decisions enable row level security;

drop policy if exists decisions_select_brand on public.decisions;
create policy decisions_select_brand on public.decisions for select
  to authenticated using (brand_id = auth.uid());

drop policy if exists decisions_insert_brand on public.decisions;
create policy decisions_insert_brand on public.decisions for insert
  to authenticated with check (brand_id = auth.uid());

drop policy if exists decisions_update_brand on public.decisions;
create policy decisions_update_brand on public.decisions for update
  to authenticated using (brand_id = auth.uid()) with check (brand_id = auth.uid());

-- 인플루언서: 자기 제안에 대한 결정(협의 내용) 조회
drop policy if exists decisions_select_influencer on public.decisions;
create policy decisions_select_influencer on public.decisions for select
  to authenticated
  using (exists (
    select 1 from public.proposal_submissions ps
    where ps.id = proposal_id and ps.influencer_id = auth.uid()
  ));
