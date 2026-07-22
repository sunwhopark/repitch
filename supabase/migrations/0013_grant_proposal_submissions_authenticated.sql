-- Phase 2-C 후속 · 0013 — proposal_submissions 테이블 권한(GRANT) 보정
-- 원인: proposal_submissions는 초기 테이블이라 authenticated 롤에 테이블 권한이 없음
--   (Supabase 기본 권한 대상 밖). 0008에서 authenticated용 RLS 정책을 추가했지만
--   테이블 GRANT가 없으면 정책은 무효 → 브랜드의 직접 select(역제안 카운트),
--   decisions upsert 시 평가되는 select 정책 서브쿼리(proposal_submissions 참조),
--   회원 인플루언서 insert(2-D)가 전부 42501(permission denied)로 실패.
-- 조치: authenticated에 SELECT/INSERT 부여. RLS가 활성이라 행 범위는 0008 정책이 제한.
-- (anon insert 권한은 기존 유지 — 비회원 역제안 제출 경로.)

grant select, insert on public.proposal_submissions to authenticated;
