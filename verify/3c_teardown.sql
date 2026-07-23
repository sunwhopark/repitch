-- Phase 3-(c) 검증 teardown. (스토리지 오브젝트 없음 — 대시보드 수동 정리 불필요)
-- proposal_submissions는 FK가 SET NULL이라 계정 삭제로 cascade 안 됨 → 명시 삭제.
-- 계정 삭제로 products/campaigns cascade.

delete from public.proposal_submissions where id in (
  '3c000000-0000-0000-0000-00000000a031',
  '3c000000-0000-0000-0000-00000000a032',
  '3c000000-0000-0000-0000-00000000a033'
);
delete from auth.users where email = '3c-brand@repitch.kr';

-- 확인(모두 0이어야 함):
-- select count(*) from auth.users where email = '3c-brand@repitch.kr';
-- select count(*) from public.proposal_submissions where brand_name = '토너랩' and product_name = '수분 진정 토너 200ml';
