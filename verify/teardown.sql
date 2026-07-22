-- 검증 데이터 정리 — Phase 2-C(verify-*) + Phase 2-B(p2b+*) 통합 teardown.
-- 최종 검증 캡처 완료 후 SQL Editor에서 실행.

-- 1) 2-C 역제안 행 먼저 삭제(proposal_submissions는 auth.users에 직접 FK가 아니라
--    계정 삭제로 cascade 안 됨. influencer_id/campaign_id는 on delete set null).
--    proposal 삭제 시 연결 decisions는 cascade로 함께 삭제됨.
delete from public.proposal_submissions
  where id in ('2c000000-0000-0000-0000-00000a000001', '2c000000-0000-0000-0000-00000a000002');

-- 2) 2-C 계정 삭제 → brands/influencers/products/campaigns/campaign_applications cascade.
delete from auth.users where email in ('verify-brand@repitch.kr', 'verify-inf@repitch.kr');

-- 3) 2-B p2b 테스트 계정(남아있다면). ※ 이미 정리됐으면 no-op.
delete from auth.users where email like 'p2b+%@repitch.kr';

-- ※ Storage 정리는 SQL 불가(storage.objects는 protect_delete로 직접 DELETE 차단).
--   업로드 이미지가 있으면 Supabase 대시보드 Storage UI에서 수동 삭제하거나,
--   코드 검증 플로우에서 supabase.storage.from('product-images').remove([...])로 삭제.
--   (이번 2-C 검증 시드는 이미지 업로드가 없어 Storage 정리 대상 없음.)
