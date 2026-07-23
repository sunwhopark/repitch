-- Phase 3-(b)-2 · 0018 — 인플루언서 OAuth 토큰 보관(Instagram 연동)
-- 설계 선택(요청의 "더 나은 방식"): influencers에 컬럼을 추가하지 않고 별도 테이블로 분리.
--   이유: /me는 influencers를 select('*')로 읽어 클라이언트(ProfileForm)에 넘긴다.
--   토큰을 influencers 컬럼에 두면 그 select('*')에 실려 브라우저로 유출된다.
--   별도 테이블 + 본인 RLS면 /me 쿼리에 안 실리고, 서버 OAuth 라우트만 사용자 세션으로 읽는다.
-- 보안 주석(운영 강화 TODO): 저장 시 암호화(pgcrypto/Supabase Vault) + select를
--   service_role/definer로만 제한 고려. 현재는 개발 모드라 본인 RLS 평문 보관.
-- 의존: 0004(influencers). 적용은 운영자(MCP read-only).

create table if not exists public.influencer_oauth (
  influencer_id uuid primary key references public.influencers(id) on delete cascade,
  provider text not null default 'instagram',
  access_token text not null,
  token_expires_at timestamptz,
  ig_user_id text,
  updated_at timestamptz not null default now()
);

comment on table public.influencer_oauth is 'OAuth 장기 토큰 보관(현재 Instagram). 본인 RLS. 클라이언트 select 대상 아님(서버 라우트 전용).';

alter table public.influencer_oauth enable row level security;

drop policy if exists influencer_oauth_select_own on public.influencer_oauth;
create policy influencer_oauth_select_own
  on public.influencer_oauth for select
  using (influencer_id = auth.uid());

drop policy if exists influencer_oauth_insert_own on public.influencer_oauth;
create policy influencer_oauth_insert_own
  on public.influencer_oauth for insert
  with check (influencer_id = auth.uid());

drop policy if exists influencer_oauth_update_own on public.influencer_oauth;
create policy influencer_oauth_update_own
  on public.influencer_oauth for update
  using (influencer_id = auth.uid())
  with check (influencer_id = auth.uid());

drop policy if exists influencer_oauth_delete_own on public.influencer_oauth;
create policy influencer_oauth_delete_own
  on public.influencer_oauth for delete
  using (influencer_id = auth.uid());

-- 신규 테이블은 authenticated 기본 권한이 없을 수 있어 명시 grant(0013 교훈).
grant select, insert, update, delete on public.influencer_oauth to authenticated;
