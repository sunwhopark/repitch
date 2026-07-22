-- 역제안서(온보딩) 제출 시 제3자 제공 동의(문구 ②) 저장 컬럼.
-- ⚠️ 배포 순서: 이 마이그레이션을 먼저 적용한 뒤 새 온보딩 코드를 배포하세요.
--    (코드가 third_party_consent 키를 insert 하는데 컬럼이 없으면 제출이 실패함)
-- MCP read-only 재잠금 상태이므로 자동 적용하지 않음 — 대시보드 SQL 에디터에서
-- 실행하거나 잠금 해제 요청.

alter table public.proposal_submissions
  add column if not exists third_party_consent boolean not null default false;

comment on column public.proposal_submissions.third_party_consent is
  '개인정보 제3자 제공 동의(문구 ②) — 채널·제안 내용 및 배송지의 브랜드 제공';
