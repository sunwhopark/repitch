-- Phase 3-(d) 검증 teardown. (스토리지 오브젝트 없음 — 대시보드 수동 정리 불필요)
-- 계정 삭제로 campaign_invitations·campaign_applications·products·campaigns 전부 cascade
-- (invitations FK: campaign/influencer/brand 모두 on delete cascade).

delete from auth.users where email in ('3d-brand@repitch.kr', '3d-inf1@repitch.kr', '3d-inf2@repitch.kr');

-- 확인(모두 0):
-- select count(*) from auth.users where email like '3d-%';
-- select count(*) from public.campaign_invitations where brand_id = '3d000000-0000-0000-0000-0000000b0005';
