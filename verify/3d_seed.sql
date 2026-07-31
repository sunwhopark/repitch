-- Phase 3-(d) 검증 시나리오 (마이그레이션 아님 — 검증 후 CLEANUP).
-- 캠페인 초대(브랜드→인플루언서) 플로우.
-- ⚠️ 0021 적용 후 실행. crypt/gen_salt 못 찾으면 extensions. 접두.
-- 로그인: 3d-brand@repitch.kr / 3d-inf1@repitch.kr / 3d-inf2@repitch.kr  (비번 repitch-verify-1234)
-- UUID: brand …b0005 / product …d0005 / campaign …e0005 / inf1 …c0005 / inf2 …c0006
--
-- 검증: 브랜드 인플루언서DB 매칭 → 제안 → inf /my 받은제안 → 수락(선정됨 전환)/거절 → 중복방지.

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3d000000-0000-0000-0000-0000000b0005',
  'authenticated', 'authenticated', '3d-brand@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','brand','brand_name','토너랩','contact_name','담당','category','뷰티',
    'pref_creator_type','상관없음','pref_creator_gender','상관없음','target_countries', jsonb_build_array(),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.brands set approved = true, approved_at = now() where id = '3d000000-0000-0000-0000-0000000b0005';

insert into public.products (id, brand_id, name, category, description, price, sales_channel, visible)
values ('3d000000-0000-0000-0000-0000000d0005', '3d000000-0000-0000-0000-0000000b0005',
        '수분 진정 토너 200ml', '뷰티', '수분·진정 저자극 토너', 22000, '올리브영', true);

insert into public.campaigns (id, brand_id, product_id, goal, status, recruit_count,
  target_ages, target_gender, target_locales, platforms, content_types, styles, desired_vibe,
  recruit_start, recruit_end, offer_type, quantity, trial_weeks, post_date_tbd)
values ('3d000000-0000-0000-0000-0000000e0005', '3d000000-0000-0000-0000-0000000b0005',
        '3d000000-0000-0000-0000-0000000d0005', '신뢰도·후기 확보', 'active', 5,
        array['20대','30대'], '여성', array['대한민국'], 'Instagram',
        array['피드 게시물'], array['전문·정보'], '차분한 톤',
        current_date, current_date + 30, 'free', 1, 4, false);

-- 인플루언서 2명(디렉토리 노출용). inf1은 인증 채널(뱃지), inf2는 미인증.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3d000000-0000-0000-0000-0000000c0005',
  'authenticated', 'authenticated', '3d-inf1@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','influencer','display_name','지수뷰티','creator_type','실물','gender','여성',
    'countries', jsonb_build_array('대한민국'), 'category', jsonb_build_array('뷰티'),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.influencers set
  channels = '[{"platform":"instagram","handle":"jisu_beauty","follower_count":41000,"avg_views":12000,"verified":true,"verified_at":"2026-07-20T00:00:00Z"}]'::jsonb,
  ship_recipient = '지수', ship_phone = '010-1111-2222', ship_address = '서울시 강남구 …'
  where id = '3d000000-0000-0000-0000-0000000c0005';

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3d000000-0000-0000-0000-0000000c0006',
  'authenticated', 'authenticated', '3d-inf2@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','influencer','display_name','민지로그','creator_type','실물','gender','여성',
    'countries', jsonb_build_array('대한민국'), 'category', jsonb_build_array('뷰티'),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.influencers set
  channels = '[{"platform":"instagram","handle":"minji_log","follower_count":18000,"avg_views":5000}]'::jsonb,
  ship_recipient = '민지', ship_phone = '010-3333-4444', ship_address = '서울시 마포구 …'
  where id = '3d000000-0000-0000-0000-0000000c0006';

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP (검증 후) — 계정 삭제로 campaign_invitations·campaign_applications·products·
-- campaigns 전부 cascade(FK on delete cascade).
-- delete from auth.users where email in ('3d-brand@repitch.kr','3d-inf1@repitch.kr','3d-inf2@repitch.kr');
-- ═══════════════════════════════════════════════════════════════════════════
