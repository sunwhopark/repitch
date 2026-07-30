-- Phase 3-(a) 검증 teardown. (스토리지 오브젝트 없음 — 대시보드 수동 정리 불필요)
-- product_snapshots는 product 삭제로 cascade. decisions/proposal은 명시 삭제
-- (proposal_submissions FK가 SET NULL이라 계정 삭제로 안 지워짐).
-- 계정 삭제로 products/campaigns(+snapshots cascade) 정리.

delete from public.decisions where proposal_id = '3a000000-0000-0000-0000-00000000a004';
delete from public.proposal_submissions where id = '3a000000-0000-0000-0000-00000000a004';
delete from auth.users where email = '3a-brand@repitch.kr';

-- 확인(모두 0):
-- select count(*) from auth.users where email = '3a-brand@repitch.kr';
-- select count(*) from public.product_snapshots s join public.products p on p.id=s.product_id where p.name='수분 진정 토너 200ml' and p.brand_id not in (select id from public.brands);
