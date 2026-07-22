-- Phase 2-A · 0004 — influencers 테이블 + 가입 트리거 role 분기
-- 목적: 인플루언서도 Auth 계정을 갖는다(즉시 가입, 승인제 아님). brands와 별도 프로필 테이블.
-- 의존: 0002(brands + handle_new_user 기준). 이 파일이 handle_new_user를 role 분기로 교체.
-- 적용 순서: 0004 → 0005 → 0006 → 0007 → 0008 → 0009.
--
-- 가입 분기: signUp options.data.role = 'brand' | 'influencer'.
--   'influencer' → public.influencers 행 생성 / 그 외(null 포함) → public.brands (하위호환).

create table if not exists public.influencers (
  id                uuid primary key references auth.users (id) on delete cascade,
  created_at        timestamptz not null default now(),
  display_name      text,                                   -- 활동명
  -- 채널 배열: [{platform:'instagram'|'youtube'|'tiktok', handle, follower_count, avg_views}]
  channels          jsonb not null default '[]'::jsonb,
  category          text[] not null default '{}',           -- 활동 카테고리(복수)
  creator_type      text check (creator_type = any (array['실물','버추얼'])),
  gender            text check (gender = any (array['여성','남성'])),
  countries         text[] not null default '{}',           -- 활동 국가
  -- 기본 배송지(선택) — 캠페인 지원 시 프리필용. 실제 지원 건에는 스냅샷으로 복사(0007).
  ship_recipient    text,
  ship_phone        text,
  ship_address      text,
  agreed_terms_at   timestamptz,
  agreed_privacy_at timestamptz,
  marketing_opt_in  boolean not null default false
);

comment on table public.influencers is '인플루언서 계정 프로필. 즉시 가입(승인 개념 없음). 가입 트리거로 생성.';
comment on column public.influencers.channels is '[{platform, handle, follower_count, avg_views}] 배열';

-- ── 가입 트리거: role 분기로 brands 또는 influencers 행 생성 ──────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := new.raw_user_meta_data ->> 'role';
begin
  if v_role = 'influencer' then
    insert into public.influencers (
      id, display_name, channels, category, creator_type, gender, countries,
      ship_recipient, ship_phone, ship_address,
      agreed_terms_at, agreed_privacy_at, marketing_opt_in
    )
    values (
      new.id,
      new.raw_user_meta_data ->> 'display_name',
      coalesce(new.raw_user_meta_data -> 'channels', '[]'::jsonb),
      coalesce((select array_agg(v) from jsonb_array_elements_text(new.raw_user_meta_data -> 'category') as t(v)), '{}'::text[]),
      new.raw_user_meta_data ->> 'creator_type',
      new.raw_user_meta_data ->> 'gender',
      coalesce((select array_agg(v) from jsonb_array_elements_text(new.raw_user_meta_data -> 'countries') as t(v)), '{}'::text[]),
      new.raw_user_meta_data ->> 'ship_recipient',
      new.raw_user_meta_data ->> 'ship_phone',
      new.raw_user_meta_data ->> 'ship_address',
      case when (new.raw_user_meta_data ->> 'agreed_terms')::boolean   then now() end,
      case when (new.raw_user_meta_data ->> 'agreed_privacy')::boolean then now() end,
      coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
    );
  else
    -- 브랜드(기본) — 0002 동작 유지.
    insert into public.brands (
      id, brand_name, category, contact_name,
      pref_creator_type, pref_creator_gender, target_countries,
      agreed_terms_at, agreed_privacy_at, marketing_opt_in
    )
    values (
      new.id,
      new.raw_user_meta_data ->> 'brand_name',
      new.raw_user_meta_data ->> 'category',
      new.raw_user_meta_data ->> 'contact_name',
      new.raw_user_meta_data ->> 'pref_creator_type',
      new.raw_user_meta_data ->> 'pref_creator_gender',
      coalesce((select array_agg(v) from jsonb_array_elements_text(new.raw_user_meta_data -> 'target_countries') as t(v)), '{}'::text[]),
      case when (new.raw_user_meta_data ->> 'agreed_terms')::boolean   then now() end,
      case when (new.raw_user_meta_data ->> 'agreed_privacy')::boolean then now() end,
      coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
    );
  end if;
  return new;
end;
$$;

-- 트리거 함수는 RPC로 직접 호출 금지(트리거 컨텍스트 전용).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 트리거 자체는 0002에서 생성됨(on_auth_user_created). 함수만 교체하므로 재생성 불필요.

-- ── RLS: 본인 행만 select/update (approved 개념 없음) ─────────────────────────
alter table public.influencers enable row level security;

drop policy if exists influencers_select_own on public.influencers;
create policy influencers_select_own
  on public.influencers for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists influencers_update_own on public.influencers;
create policy influencers_update_own
  on public.influencers for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
-- INSERT 정책 없음: 행은 가입 트리거(definer)만 생성.
