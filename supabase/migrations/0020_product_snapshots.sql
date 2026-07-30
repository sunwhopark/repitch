-- Phase 3-(a) · 0020 — 커머스 성과 시계열(제품 스냅샷)
-- 제품별 하루 1회 스냅샷을 쌓아 시계열 차트로 보여준다. 결측 허용(수집 실패=정상).
-- 핵심 지표는 매출(revenue)·리뷰·가격. rank(카테고리 순위)는 옵션(크롤 가능 시에만).
--
-- source:
--   'manual'  — 브랜드가 직접 입력([지표 직접 입력]). 매출/주문은 비공개라 현재 유일한 실경로.
--   'coupang' | 'naver' — 공개 상품페이지 파서(현재 서버 IP 차단으로 대부분 결측, 우회 안 함).
--   ▶ v2 확장: 판매자 연동(OAuth 공식 API)으로 매출·주문 자동화 예정 —
--     source에 'naver_commerce' | 'cafe24' 등을 추가하는 구조. 스키마 변경 없이 값만 확장.
-- 의존: 0006(products). 적용은 운영자(MCP read-only).

create table if not exists public.product_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  captured_at date not null default current_date,
  rank integer,                 -- 카테고리 판매 순위(낮을수록 상위) · 옵션(결측 허용)
  review_count integer,         -- 누적 리뷰 수
  rating numeric(3,2),          -- 평점 0~5
  price integer,                -- 판매가(원)
  revenue bigint,               -- 매출액(원) · 핵심 지표 · 크롤 불가(비공개) → manual/판매자연동
  order_count integer,          -- 주문 수 · 〃
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (product_id, captured_at)   -- 제품·날짜당 1행(같은 날 재수집/재입력은 upsert)
);

comment on table public.product_snapshots is
  '제품 커머스 성과 시계열(일 1행). 매출/리뷰/가격 중심, rank 옵션. source: manual|coupang|naver (+v2 naver_commerce|cafe24).';

create index if not exists product_snapshots_product_captured_idx
  on public.product_snapshots (product_id, captured_at);

alter table public.product_snapshots enable row level security;

-- 브랜드는 자기 제품의 스냅샷만 접근(제품 상세에서 직접 read/write).
drop policy if exists product_snapshots_select_own on public.product_snapshots;
create policy product_snapshots_select_own on public.product_snapshots for select
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.brand_id = auth.uid()));

drop policy if exists product_snapshots_insert_own on public.product_snapshots;
create policy product_snapshots_insert_own on public.product_snapshots for insert
  to authenticated
  with check (exists (select 1 from public.products p where p.id = product_id and p.brand_id = auth.uid()));

drop policy if exists product_snapshots_update_own on public.product_snapshots;
create policy product_snapshots_update_own on public.product_snapshots for update
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.brand_id = auth.uid()))
  with check (exists (select 1 from public.products p where p.id = product_id and p.brand_id = auth.uid()));

drop policy if exists product_snapshots_delete_own on public.product_snapshots;
create policy product_snapshots_delete_own on public.product_snapshots for delete
  to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.brand_id = auth.uid()));

-- 신규 테이블 명시 grant(0013 교훈). 크론(서버)은 service_role로 RLS 우회하여 기록.
grant select, insert, update, delete on public.product_snapshots to authenticated;
