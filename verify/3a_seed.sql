-- Phase 3-(a) 검증 시나리오 (마이그레이션 아님 — 검증 후 CLEANUP).
-- 커머스 성과 시계열(매출 중심) + 수락 이벤트 마커 + 이 빠진 그래프.
-- ⚠️ 0020 적용 후 실행. crypt/gen_salt 못 찾으면 extensions. 접두.
-- 로그인: 3a-brand@repitch.kr  (비번 repitch-verify-1234)
-- UUID: brand …b0004 / product …d0004 / campaign …e0004 / proposal …a0004
--
-- 검증 포인트:
--   · 매출/리뷰/가격 시계열 표시(수동 3일치, 비연속 → 일부 날짜 미수집 gap)
--   · '수락' 이벤트 마커(-5일) 이후 매출 상승 = 핵심 증거 화면
--   · [지표 직접 입력]으로 오늘치 추가, [지금 수집]은 실 URL 차단 → 조용한 실패

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '3a000000-0000-0000-0000-0000000b0004',
  'authenticated', 'authenticated', '3a-brand@repitch.kr', crypt('repitch-verify-1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('role','brand','brand_name','토너랩','contact_name','담당','category','뷰티',
    'pref_creator_type','상관없음','pref_creator_gender','상관없음','target_countries', jsonb_build_array(),
    'agreed_terms', true, 'agreed_privacy', true),
  now(), now(), '', '', '', '');
update public.brands set approved = true, approved_at = now() where id = '3a000000-0000-0000-0000-0000000b0004';

-- 실 상품 URL(쿠팡) — [지금 수집] 차단 데모용(값은 안 들어옴, 조용한 실패 정상).
insert into public.products (id, brand_id, name, category, description, price, sales_channel, product_url, visible)
values ('3a000000-0000-0000-0000-0000000d0004', '3a000000-0000-0000-0000-0000000b0004',
        '수분 진정 토너 200ml', '뷰티', '수분·진정 저자극 토너', 22000, '쿠팡',
        'https://www.coupang.com/vp/products/7376900079', true);

insert into public.campaigns (id, brand_id, product_id, goal, status, recruit_count,
  target_ages, target_gender, target_locales, platforms, content_types, styles, desired_vibe,
  recruit_start, recruit_end, offer_type, quantity, trial_weeks, post_date_tbd)
values ('3a000000-0000-0000-0000-0000000e0004', '3a000000-0000-0000-0000-0000000b0004',
        '3a000000-0000-0000-0000-0000000d0004', '매출·후기 확보', 'active', 5,
        array['20대','30대'], '여성', array['대한민국'], 'Instagram',
        array['피드 게시물'], array['전문·정보'], '차분한 톤',
        current_date - 20, current_date + 10, 'free', 1, 4, false);

-- 이벤트 마커용 — 이 제품 대상 역제안 1건 + '수락' 결정(5일 전, 게시 근사).
insert into public.proposal_submissions (id, brand_name, product_name, platform, profile_name, profile_count,
  selected_categories, peak_views, collab_count, story_text, content_types, content_tone,
  expected_price, reuse_allowed, contact_email, privacy_consent, consent_at, third_party_consent,
  target_type, product_id, auth_status)
values ('3a000000-0000-0000-0000-00000000a004'::uuid, '토너랩', '수분 진정 토너 200ml', 'instagram', '지수_실사용', 41000,
  array['뷰티'], 52000, '5회', '3년째 쓰는 토너 실사용 후기를 올리고 싶어요.',
  '["피드 게시물"]'::jsonb, '전문·정보', 25, true, '3a-a@repitch.kr', true, now(), true,
  'product', '3a000000-0000-0000-0000-0000000d0004', 'pending');

insert into public.decisions (id, proposal_id, brand_id, decision, reasons, created_at, updated_at)
values (gen_random_uuid(), '3a000000-0000-0000-0000-00000000a004', '3a000000-0000-0000-0000-0000000b0004',
        'accepted', array[]::text[], now() - interval '5 days', now() - interval '5 days');

-- 수동 스냅샷 3일치(비연속: -6, -4, -2) — 수락(-5) 이후 매출·리뷰 상승.
insert into public.product_snapshots (product_id, captured_at, review_count, rating, price, revenue, order_count, source) values
  ('3a000000-0000-0000-0000-0000000d0004', current_date - 6, 118, 4.4, 22000, 1200000, 42, 'manual'),
  ('3a000000-0000-0000-0000-0000000d0004', current_date - 4, 152, 4.5, 22000, 2100000, 74, 'manual'),
  ('3a000000-0000-0000-0000-0000000d0004', current_date - 2, 205, 4.6, 22000, 3400000, 121, 'manual');

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP (검증 후) — product_snapshots는 product 삭제로 cascade, decisions/proposal은
-- 명시 삭제(proposal FK는 SET NULL). 계정 삭제로 products/campaigns cascade.
-- delete from public.decisions where proposal_id = '3a000000-0000-0000-0000-00000000a004';
-- delete from public.proposal_submissions where id = '3a000000-0000-0000-0000-00000000a004';
-- delete from auth.users where email = '3a-brand@repitch.kr';
-- ═══════════════════════════════════════════════════════════════════════════
