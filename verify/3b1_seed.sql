-- Phase 3-(b)-1 검증 시나리오 (마이그레이션 아님 — 검증 후 CLEANUP).
-- YouTube 채널 연동: /me에서 실존 채널 [채널 확인] → verified 저장 → 브랜드 인박스 뱃지.
-- ⚠️ crypt/gen_salt 못 찾으면 extensions. 접두. (스키마 변경 없음 — channels는 jsonb)
-- 로그인: 3b-brand@repitch.kr / 3b-inf@repitch.kr  (비번 repitch-verify-1234)
-- UUID: brand …b0001 / inf …c0001 / product …d0001 / campaign …e0001 / proposal …a0001
--
-- 검증 흐름:
--   1) inf 로그인 → /me: youtube 채널(미검증, @mrbeast 프리필) → [채널 확인] → 카드 → 저장
--      → 새로고침해도 verified 뱃지 유지. (구독자·평균 조회수 자동 채움)
--   2) brand 로그인 → 인박스: 해당 역제안 행에 ✓ 채널 인증 뱃지 표시.
--      점수는 verified 구독자(509M)를 우선 사용(B1 성과 효율).

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3b000000-0000-0000-0000-0000000b0001',
  'authenticated', 'authenticated', '3b-brand@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','brand','brand_name','케이글로우','contact_name','담당','category','뷰티',
    'pref_creator_type','상관없음','pref_creator_gender','상관없음','target_countries', jsonb_build_array(),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.brands set approved = true, approved_at = now() where id = '3b000000-0000-0000-0000-0000000b0001';

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3b000000-0000-0000-0000-0000000c0001',
  'authenticated', 'authenticated', '3b-inf@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','influencer','display_name','제인TV','creator_type','실물','gender','여성',
    'countries', jsonb_build_array('대한민국'), 'category', jsonb_build_array('뷰티'),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
-- 미검증 youtube 채널(프리필). /me에서 [채널 확인]으로 verified 전환.
update public.influencers set
  channels = '[{"platform":"youtube","handle":"@mrbeast","follower_count":null,"avg_views":null}]'::jsonb,
  ship_recipient = '제인', ship_phone = '010-2222-3333', ship_address = '서울시 마포구 …'
  where id = '3b000000-0000-0000-0000-0000000c0001';

insert into public.products (id, brand_id, name, category, description, price, sales_channel, visible)
values ('3b000000-0000-0000-0000-0000000d0001', '3b000000-0000-0000-0000-0000000b0001',
        '글로우 세럼 30ml', '뷰티', '비타민C 브라이트닝 세럼', 34000, '자사몰', true);

insert into public.campaigns (id, brand_id, product_id, goal, status, recruit_count,
  target_ages, target_gender, target_locales, platforms, content_types, styles, desired_vibe,
  recruit_start, recruit_end, offer_type, quantity, trial_weeks, post_date_tbd)
values ('3b000000-0000-0000-0000-0000000e0001', '3b000000-0000-0000-0000-0000000b0001',
        '3b000000-0000-0000-0000-0000000d0001', '브랜드 인지도·조회수', 'active', 5,
        array['20대','30대'], '여성', array['대한민국'], 'YouTube',
        array['숏폼 (릴스·쇼츠·틱톡)','롱폼 영상'], array['감성·분위기','전문·정보'], '밝고 신뢰감 있는 톤',
        current_date, current_date + 30, 'free', 1, 2, false);

-- youtube 역제안(캠페인 경유). 제출 시점 구독자는 회원 자기기입값(12,000) — 검증 후 509M로 대체됨.
insert into public.proposal_submissions (id, brand_name, product_name, platform, profile_name, profile_count,
  selected_categories, avg_views, peak_views, collab_count, story_text, content_types, content_tone,
  expected_price, reuse_allowed, upload_date, contact_email, privacy_consent, consent_at, third_party_consent,
  influencer_id, target_type, campaign_id, product_id)
values ('3b000000-0000-0000-0000-0000000a0001', '케이글로우', '글로우 세럼 30ml', 'youtube', '제인TV', 12000,
  array['뷰티'], '15000', 30000, '3회', '뷰티 리뷰 채널 운영 중이에요. 세럼 정직 리뷰로 신뢰도를 쌓아왔습니다.',
  '["숏폼 (릴스·쇼츠·틱톡)"]'::jsonb, '전문·정보',
  20, true, null, '3b-inf@repitch.kr', true, now(), true,
  '3b000000-0000-0000-0000-0000000c0001', 'campaign', '3b000000-0000-0000-0000-0000000e0001',
  '3b000000-0000-0000-0000-0000000d0001');

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP (검증 후) — 계정 삭제로 brands/influencers/products/campaigns cascade.
-- proposal_submissions는 FK가 없을 수 있으니 명시 삭제.
-- delete from public.proposal_submissions where id = '3b000000-0000-0000-0000-0000000a0001';
-- delete from auth.users where email in ('3b-brand@repitch.kr','3b-inf@repitch.kr');
-- ═══════════════════════════════════════════════════════════════════════════
