-- Phase 2-C+ · 0014 — 브랜드별 평가 가중치 brands.weights
-- 목적: 종합점수 축 가중치를 브랜드마다 저장. 가입 시 카테고리 추천값을 메타데이터로
--   받아 저장(추천 매핑은 클라이언트 lib/scoring/recommended-weights.ts에서 계산 → 중복 없음).
-- 의존: 0002/0004(handle_new_user). 적용은 운영자(MCP read-only).

alter table public.brands
  add column if not exists weights jsonb not null default '{"fit":40,"quality":30,"auth":30}'::jsonb;

comment on column public.brands.weights is '평가 가중치 {fit,quality,auth} 정수·합 100. 가입 시 카테고리 추천값, 설정에서 조정.';

-- handle_new_user 갱신 — 브랜드 분기에 weights 저장(메타데이터 우선, 없으면 기본).
-- (인플루언서 분기는 0004와 동일)
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
    insert into public.brands (
      id, brand_name, category, contact_name,
      pref_creator_type, pref_creator_gender, target_countries,
      agreed_terms_at, agreed_privacy_at, marketing_opt_in, weights
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
      coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false),
      coalesce(new.raw_user_meta_data -> 'weights', '{"fit":40,"quality":30,"auth":30}'::jsonb)
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
