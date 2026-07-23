-- Phase 3-(b)-2 검증 시나리오 (마이그레이션 아님 — 검증 후 CLEANUP).
-- Instagram 연동 + 지원자 패널/인박스 인증 뱃지 확인용.
-- ⚠️ 0017·0018 적용 후 실행. crypt/gen_salt 못 찾으면 extensions. 접두.
-- 로그인: 3b2-brand@repitch.kr / 3b2-inf@repitch.kr  (비번 repitch-verify-1234)
-- UUID: brand …b0002 / inf …c0002 / product …d0002 / campaign …e0002 / app …f0002 / proposal …a0002
--
-- 검증 흐름(0017·0018 적용 + Meta 앱 세팅·본인 IG 테스터 등록 후):
--   1) inf 로그인 → /me: instagram 채널 추가 → [Instagram 계정 연동] → 본인 IG 동의
--      → /me?ig=connected → @유저명 · 계정 인증 카드(팔로워·평균 조회수) 저장·유지.
--   2) brand 로그인 → 캠페인 상세 지원자 패널: 해당 지원자에 ✓ 뱃지(0017).
--   3) brand 인박스: instagram 역제안에 ✓ 뱃지(연동으로 verified instagram 채널 생김).

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3b200000-0000-0000-0000-0000000b0002',
  'authenticated', 'authenticated', '3b2-brand@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','brand','brand_name','케이글로우','contact_name','담당','category','뷰티',
    'pref_creator_type','상관없음','pref_creator_gender','상관없음','target_countries', jsonb_build_array(),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.brands set approved = true, approved_at = now() where id = '3b200000-0000-0000-0000-0000000b0002';

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3b200000-0000-0000-0000-0000000c0002',
  'authenticated', 'authenticated', '3b2-inf@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','influencer','display_name','제인TV','creator_type','실물','gender','여성',
    'countries', jsonb_build_array('대한민국'), 'category', jsonb_build_array('뷰티'),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
-- 미연동 instagram 채널(프리필). /me에서 [Instagram 계정 연동]으로 verified 전환.
update public.influencers set
  channels = '[{"platform":"instagram","handle":"","follower_count":null,"avg_views":null}]'::jsonb,
  ship_recipient = '제인', ship_phone = '010-2222-3333', ship_address = '서울시 마포구 …'
  where id = '3b200000-0000-0000-0000-0000000c0002';

insert into public.products (id, brand_id, name, category, description, price, sales_channel, visible)
values ('3b200000-0000-0000-0000-0000000d0002', '3b200000-0000-0000-0000-0000000b0002',
        '글로우 세럼 30ml', '뷰티', '비타민C 브라이트닝 세럼', 34000, '자사몰', true);

insert into public.campaigns (id, brand_id, product_id, goal, status, recruit_count,
  target_ages, target_gender, target_locales, platforms, content_types, styles, desired_vibe,
  recruit_start, recruit_end, offer_type, quantity, trial_weeks, post_date_tbd)
values ('3b200000-0000-0000-0000-0000000e0002', '3b200000-0000-0000-0000-0000000b0002',
        '3b200000-0000-0000-0000-0000000d0002', '브랜드 인지도', 'active', 5,
        array['20대','30대'], '여성', array['대한민국'], 'Instagram',
        array['숏폼 (릴스·쇼츠·틱톡)','피드 게시물'], array['감성·분위기'], '밝고 신뢰감 있는 톤',
        current_date, current_date + 30, 'free', 1, 2, false);

-- 지원자 패널 표시용 — 체험 중(in_trial) 지원건 (0017 뱃지 확인 대상)
insert into public.campaign_applications (id, campaign_id, influencer_id, third_party_consent_at,
  status, ship_recipient, ship_phone, ship_address, courier, tracking_no,
  selected_at, shipped_at, delivered_at, created_at)
values ('3b200000-0000-0000-0000-0000000f0002', '3b200000-0000-0000-0000-0000000e0002',
        '3b200000-0000-0000-0000-0000000c0002', now(),
        'in_trial', '제인', '010-2222-3333', '서울시 마포구 …', 'CJ대한통운', '123456789012',
        now() - interval '18 days', now() - interval '14 days', now() - interval '12 days', now() - interval '20 days');

-- instagram 역제안(인박스 뱃지 확인 대상). 연동 후 verified instagram 채널이 생겨 ✓ 표시.
insert into public.proposal_submissions (id, brand_name, product_name, platform, profile_name, profile_count,
  selected_categories, avg_views, peak_views, collab_count, story_text, content_types, content_tone,
  expected_price, reuse_allowed, upload_date, contact_email, privacy_consent, consent_at, third_party_consent,
  influencer_id, target_type, campaign_id, product_id, application_id)
values ('3b200000-0000-0000-0000-0000000a0002', '케이글로우', '글로우 세럼 30ml', 'instagram', '제인TV', 12000,
  array['뷰티'], '15000', 30000, '3회', '뷰티 리뷰 계정 운영 중이에요. 세럼 정직 리뷰로 신뢰도를 쌓아왔습니다.',
  '["숏폼 (릴스·쇼츠·틱톡)"]'::jsonb, '감성·분위기',
  20, true, null, '3b2-inf@repitch.kr', true, now(), true,
  '3b200000-0000-0000-0000-0000000c0002', 'campaign', '3b200000-0000-0000-0000-0000000e0002',
  '3b200000-0000-0000-0000-0000000d0002', '3b200000-0000-0000-0000-0000000f0002');

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP (검증 후)
-- delete from public.influencer_oauth where influencer_id = '3b200000-0000-0000-0000-0000000c0002';
-- delete from public.proposal_submissions where id = '3b200000-0000-0000-0000-0000000a0002';
-- delete from auth.users where email in ('3b2-brand@repitch.kr','3b2-inf@repitch.kr');
-- ═══════════════════════════════════════════════════════════════════════════
