-- Phase 2-D-1 검증 시나리오 (마이그레이션 아님 — 검증 후 하단 CLEANUP).
-- 브랜드(승인·활성 캠페인) + 확인된 인플루언서(프로필 완성, 지원 없음).
-- ⚠️ 0015 적용 후 실행. crypt/gen_salt 못 찾으면 extensions. 접두.
-- 로그인: 2d-brand@repitch.kr / 2d-inf@repitch.kr  (비번 repitch-verify-1234)

-- 고정 UUID: brand …b0001 / inf …c0001 / product …d0001 / campaign …e0001

-- 1) 브랜드(승인)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '2d000000-0000-0000-0000-0000000b0001',
  'authenticated', 'authenticated', '2d-brand@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','brand','brand_name','토너랩','contact_name','담당','category','뷰티',
    'pref_creator_type','상관없음','pref_creator_gender','상관없음','target_countries', jsonb_build_array(),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.brands set approved = true, approved_at = now() where id = '2d000000-0000-0000-0000-0000000b0001';

-- 2) 인플루언서(확인 + 프로필 완성, 지원 없음)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '2d000000-0000-0000-0000-0000000c0001',
  'authenticated', 'authenticated', '2d-inf@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','influencer','display_name','민지뷰티','creator_type','실물','gender','여성',
    'countries', jsonb_build_array('대한민국'), 'category', jsonb_build_array('뷰티'),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.influencers set
  channels = '[{"platform":"instagram","handle":"minji_beauty","follower_count":32000,"avg_views":45000}]'::jsonb,
  ship_recipient = '민지', ship_phone = '010-1234-5678', ship_address = '서울시 성동구 …'
  where id = '2d000000-0000-0000-0000-0000000c0001';

-- 3) 제품(공개) + 활성 캠페인
insert into public.products (id, brand_id, name, category, description, price, sales_channel, visible)
values ('2d000000-0000-0000-0000-0000000d0001', '2d000000-0000-0000-0000-0000000b0001',
        '수분 진정 토너 200ml', '뷰티', '수분·진정 저자극 토너', 22000, '올리브영', true);

insert into public.campaigns (id, brand_id, product_id, goal, status, recruit_count,
  target_ages, target_gender, target_locales, platforms, content_types, styles, desired_vibe,
  recruit_start, recruit_end, offer_type, quantity, trial_weeks, post_date_tbd)
values ('2d000000-0000-0000-0000-0000000e0001', '2d000000-0000-0000-0000-0000000b0001',
        '2d000000-0000-0000-0000-0000000d0001', '신뢰도·후기 확보', 'active', 5,
        array['20대','30대'], '여성', array['대한민국'], 'Instagram, YouTube',
        array['숏폼 (릴스·쇼츠·틱톡)','피드 게시물'], array['감성·분위기','전문·정보'], '차분하고 정보성 있는 톤',
        current_date, current_date + 30, 'free', 1, 2, false);

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP (검증 후) — 계정 삭제로 brands/influencers/products/campaigns/applications cascade.
-- delete from auth.users where email in ('2d-brand@repitch.kr','2d-inf@repitch.kr');
-- ═══════════════════════════════════════════════════════════════════════════
