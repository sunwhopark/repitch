-- Phase 2-A · 0010 — get_* definer 함수의 anon EXECUTE 명시적 회수
-- 검증에서 발견: 0005/0006의 `revoke execute ... from public`은 anon을 막지 못함.
-- Supabase가 default privileges로 anon/authenticated에 EXECUTE를 "명시적으로" 부여하기
-- 때문(public 회수로는 제거 안 됨). 설계 의도(인플루언서=로그인 사용자만 노출, anon 차단)에
-- 맞추려면 anon에서 직접 회수해야 함. advisor 0028(anon) 해소, 0029(authenticated)는 설계상 유지.
--
-- ※ 만약 비로그인(anon) 공개 카탈로그 브라우징을 원하면 이 파일을 적용하지 말 것.

revoke execute on function public.get_visible_products() from anon;
revoke execute on function public.get_active_campaigns() from anon;
