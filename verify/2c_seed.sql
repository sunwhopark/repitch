-- Phase 2-C 검증용 시나리오 데이터 (마이그레이션 아님 — 검증 후 하단 CLEANUP로 삭제)
-- SQL Editor에서 실행. brands/influencers.id는 auth.users FK라 auth 계정을 만든다
-- (즉 "auth 포함" 방식). handle_new_user 트리거가 role로 분기해 프로필 행을 생성.
--
-- ⚠️ crypt/gen_salt(pgcrypto): 함수를 못 찾으면 extensions.crypt / extensions.gen_salt 로 접두.
-- ⚠️ 로그인 계정: verify-brand@repitch.kr / 비번 repitch-verify-1234 (검증 로그인용).

-- 고정 UUID
--   brand   2c000000-0000-0000-0000-0000000b0001
--   inf     2c000000-0000-0000-0000-0000000c0001
--   product 2c000000-0000-0000-0000-0000000d0001
--   campaign2c000000-0000-0000-0000-0000000e0001
--   app     2c000000-0000-0000-0000-0000000f0001
--   prop1   2c000000-0000-0000-0000-00000a000001  (캠페인 경유)
--   prop2   2c000000-0000-0000-0000-00000a000002  (제품 직접)

-- ── 1) 브랜드 계정 (트리거가 brands 생성) + 승인 ──────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '2c000000-0000-0000-0000-0000000b0001',
  'authenticated', 'authenticated', 'verify-brand@repitch.kr',
  crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','brand','brand_name','검증브랜드','contact_name','검증담당',
    'category','뷰티','pref_creator_type','상관없음','pref_creator_gender','상관없음',
    'target_countries', jsonb_build_array(),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', ''
);
update public.brands set approved = true, approved_at = now()
  where id = '2c000000-0000-0000-0000-0000000b0001';

-- ── 2) 인플루언서 계정 (트리거가 influencers 생성) + 채널 세팅 ─────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '2c000000-0000-0000-0000-0000000c0001',
  'authenticated', 'authenticated', 'verify-inf@repitch.kr',
  crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','influencer','display_name','서연뷰티',
    'creator_type','실물','gender','여성',
    'countries', jsonb_build_array('대한민국'),
    'category', jsonb_build_array('뷰티'),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', ''
);
update public.influencers
  set channels = '[{"platform":"instagram","handle":"seoyeon_beauty","follower_count":28000,"avg_views":40000}]'::jsonb
  where id = '2c000000-0000-0000-0000-0000000c0001';

-- ── 3) 제품 + 캠페인 ─────────────────────────────────────────────────────────
insert into public.products (id, brand_id, name, category, description, price, sales_channel, visible)
values ('2c000000-0000-0000-0000-0000000d0001', '2c000000-0000-0000-0000-0000000b0001',
        '검증 데일리 토너 200ml', '뷰티', '각질 정리 저자극 토너', 19000, '올리브영', true);

insert into public.campaigns (id, brand_id, product_id, goal, status, recruit_count,
  target_ages, target_gender, recruit_start, recruit_end, offer_type, quantity, trial_weeks)
values ('2c000000-0000-0000-0000-0000000e0001', '2c000000-0000-0000-0000-0000000b0001',
        '2c000000-0000-0000-0000-0000000d0001', '신뢰도·후기 확보', 'active', 5,
        array['20대','30대'], '여성', current_date, current_date + 30, 'free', 1, 2);

-- ── 4) 지원(application) — 체험 시작 21일 전(C1 체험기간 계산용) ───────────────
insert into public.campaign_applications (id, campaign_id, influencer_id, third_party_consent_at,
  status, selected_at, shipped_at, created_at)
values ('2c000000-0000-0000-0000-0000000f0001', '2c000000-0000-0000-0000-0000000e0001',
        '2c000000-0000-0000-0000-0000000c0001', now(), 'proposal_sent',
        now() - interval '25 days', now() - interval '21 days', now() - interval '25 days');

-- ── 5) 역제안 2건 (서사·지표 포함) ───────────────────────────────────────────
-- 5a. 캠페인 경유 (application 연결 → C1 ~3주)
insert into public.proposal_submissions (
  id, brand_name, product_name, platform, profile_name, profile_count, selected_categories,
  avg_likes, avg_saves, avg_shares, avg_views, peak_views, collab_count, story_text,
  content_types, content_tone, expected_price, reuse_allowed, upload_date,
  contact_email, privacy_consent, third_party_consent,
  influencer_id, target_type, campaign_id, application_id, created_at
) values (
  '2c000000-0000-0000-0000-00000a000001', '검증브랜드', '검증 데일리 토너 200ml',
  'instagram', 'seoyeon_beauty', 28000, array['뷰티'],
  '1만-10만', '1천-1만', '1천-1만', '1만-10만', 84000, '4-6회',
  '3주째 매일 아침 세안 후 화장솜에 덜어 닦아내며 써봤어요. 각질 정리가 확실해서 다음 스텝 흡수가 달라지는 걸 매일 느낍니다. 지성 피부라 끈적임 없는 마무리가 특히 좋았고, 여름엔 냉장 보관해 진정용으로도 썼어요. 실사용 컷과 전후 비교로 숏폼 2개 + 피드 1개를 제안드려요.',
  '[{"label":"숏폼","count":2},{"label":"게시물","count":1}]'::jsonb, '정보', 25, true, '2026.07.22 (수)',
  'verify-inf@repitch.kr', true, true,
  '2c000000-0000-0000-0000-0000000c0001', 'campaign',
  '2c000000-0000-0000-0000-0000000e0001', '2c000000-0000-0000-0000-0000000f0001', now()
);

-- 5b. 제품 직접 (application 없음 → C1 짧음, 제품 상세로도 연결)
insert into public.proposal_submissions (
  id, brand_name, product_name, platform, profile_name, profile_count, selected_categories,
  avg_views, peak_views, collab_count, story_text,
  content_types, content_tone, expected_price, reuse_allowed, upload_date,
  contact_email, privacy_consent, third_party_consent,
  influencer_id, target_type, product_id, created_at
) values (
  '2c000000-0000-0000-0000-00000a000002', '검증브랜드', '검증 데일리 토너 200ml',
  'youtube', 'seoyeon_beauty_yt', 51000, array['뷰티'],
  '10만-100만', 120000, '7회 이상',
  '토너 리뷰 롱폼을 준비 중이에요. 성분표 분석 + 2주 사용기를 한 편으로 엮어 제품 상세 페이지에 바로 제안드립니다. 광고 표기는 가이드대로 명확히 넣습니다.',
  '[{"label":"롱폼 리뷰 영상","count":1}]'::jsonb, '정보', 40, true, '2026.07.21 (화)',
  'verify-inf@repitch.kr', true, true,
  '2c000000-0000-0000-0000-0000000c0001', 'product',
  '2c000000-0000-0000-0000-0000000d0001', now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP (검증 후 실행) — auth.users 삭제가 brands/influencers/campaigns/products/
--   applications/proposals까지 on delete cascade로 정리. decisions도 cascade.
-- delete from auth.users where email in ('verify-brand@repitch.kr','verify-inf@repitch.kr');
-- ═══════════════════════════════════════════════════════════════════════════
