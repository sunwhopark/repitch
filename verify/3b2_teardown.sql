-- Phase 3-(b)-2 검증 teardown. (스토리지 오브젝트 없음 — 대시보드 수동 정리 불필요)
-- 계정 삭제로 influencers→(campaign_applications[cascade], influencer_oauth[cascade]),
-- brands→(products, campaigns[→applications]) 전부 cascade. 단, proposal_submissions는
-- FK가 SET NULL이라 cascade 안 됨 → 명시 삭제.

delete from public.proposal_submissions where id = '3b200000-0000-0000-0000-0000000a0002';
delete from auth.users where email in ('3b2-brand@repitch.kr', '3b2-inf@repitch.kr');

-- 확인(모두 0이어야 함):
-- select count(*) from auth.users where email like '3b2-%';
-- select count(*) from public.influencer_oauth where influencer_id = '3b200000-0000-0000-0000-0000000c0002';
-- select count(*) from public.proposal_submissions where id = '3b200000-0000-0000-0000-0000000a0002';
