-- Phase 1 후속: 가입 동의 기록을 brands에 저장.
-- MCP가 read-only로 재잠금돼 있어 자동 적용하지 않음 — 이 파일을 검토 후
-- (a) MCP write 모드로 잠깐 열어 apply_migration 하거나, (b) Supabase 대시보드
-- SQL 에디터에서 실행해 주세요. (임의 우회 없음)

-- 1) 동의 컬럼 추가
alter table public.brands
  add column if not exists agreed_terms_at   timestamptz,  -- 이용약관 동의 시각(필수)
  add column if not exists agreed_privacy_at timestamptz,  -- 개인정보 수집·이용 동의 시각(필수)
  add column if not exists marketing_opt_in  boolean not null default false; -- 마케팅 수신(선택)

comment on column public.brands.agreed_terms_at is '이용약관 동의 시각';
comment on column public.brands.agreed_privacy_at is '개인정보 수집·이용 동의 시각';
comment on column public.brands.marketing_opt_in is '마케팅 정보 수신 동의(선택)';

-- 2) 가입 트리거가 동의값도 함께 기록하도록 갱신.
--    signUp options.data 로 agreed_terms / agreed_privacy(필수 → true) 와
--    marketing_opt_in(선택) 을 전달받아 저장. 동의 시각은 가입(=동의) 시점 now().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
    coalesce(
      (select array_agg(v) from jsonb_array_elements_text(new.raw_user_meta_data -> 'target_countries') as t(v)),
      '{}'::text[]
    ),
    case when (new.raw_user_meta_data ->> 'agreed_terms')::boolean   then now() end,
    case when (new.raw_user_meta_data ->> 'agreed_privacy')::boolean then now() end,
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$$;

-- 트리거 함수는 RPC로 직접 호출되면 안 됨(트리거 컨텍스트에서만 실행).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
