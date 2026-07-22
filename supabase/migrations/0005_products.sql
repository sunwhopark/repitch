-- Phase 2-A · 0005 — products 테이블 + 인플루언서 노출용 definer 함수
-- 목적: 브랜드가 등록하는 제품. 역제안 진입점 "입점 제품 직접"의 대상.
-- 의존: 0004(브랜드는 0002 brands). 적용 순서 0005 (0004 이후).

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  brand_id      uuid not null references public.brands (id) on delete cascade,
  name          text not null,
  category      text check (category = any (array['뷰티','패션','식품','헬스·피트니스','라이프스타일','앱·서비스','전자기기'])),
  description   text,
  image_url     text,
  price         int,
  sales_channel text check (sales_channel = any (array['올리브영','쿠팡','네이버 스마트스토어','자사몰','기타'])),
  product_url   text,
  visible       boolean not null default false    -- 인플루언서 노출 여부
);

comment on table public.products is '브랜드 제품. visible=true만 인플루언서에게 노출(get_visible_products).';

-- ── RLS: 브랜드 자기 것만 CRUD ───────────────────────────────────────────────
alter table public.products enable row level security;

drop policy if exists products_select_own on public.products;
create policy products_select_own on public.products for select
  to authenticated using (brand_id = auth.uid());

drop policy if exists products_insert_own on public.products;
create policy products_insert_own on public.products for insert
  to authenticated with check (brand_id = auth.uid());

drop policy if exists products_update_own on public.products;
create policy products_update_own on public.products for update
  to authenticated using (brand_id = auth.uid()) with check (brand_id = auth.uid());

drop policy if exists products_delete_own on public.products;
create policy products_delete_own on public.products for delete
  to authenticated using (brand_id = auth.uid());

-- ── 인플루언서 노출: visible=true 제품의 공개 필드만(브랜드명 포함, 내부 필드 제외) ──
-- SECURITY DEFINER로 RLS 우회 후 공개 필드만 반환. (의도된 RPC — advisor의
-- "authenticated can execute security definer" WARN은 설계상 정상)
create or replace function public.get_visible_products()
returns table (
  id            uuid,
  brand_name    text,
  name          text,
  category      text,
  description   text,
  image_url     text,
  price         int,
  sales_channel text,
  product_url   text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, b.brand_name, p.name, p.category, p.description,
         p.image_url, p.price, p.sales_channel, p.product_url
  from public.products p
  join public.brands b on b.id = p.brand_id
  where p.visible = true
  order by p.created_at desc;
$$;

-- 로그인 사용자(인플루언서)만 호출. anon 차단.
revoke execute on function public.get_visible_products() from public;
grant execute on function public.get_visible_products() to authenticated;
