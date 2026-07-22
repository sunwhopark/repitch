-- Phase 2-B · 0011 — Storage 버킷 product-images (제품 이미지)
-- 목적: 브랜드 제품/캠페인 이미지 업로드. 공개 읽기(카탈로그 노출), 쓰기는 브랜드별 폴더.
-- 경로 규칙: {brand_id}/{filename}  (첫 폴더 = auth.uid() = brand_id)
-- 적용은 운영자(SQL Editor). MCP read-only 유지.

-- 버킷 생성(공개 읽기)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 읽기: 공개(카탈로그·비로그인 노출과 정합)
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- 쓰기: 브랜드는 자기 폴더({brand_id}/…)에만 업로드/수정/삭제
drop policy if exists "product-images brand insert" on storage.objects;
create policy "product-images brand insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product-images brand update" on storage.objects;
create policy "product-images brand update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product-images brand delete" on storage.objects;
create policy "product-images brand delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
