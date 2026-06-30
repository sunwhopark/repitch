-- Migration: create_proposal_submissions
-- Reverse-proposal submission storage for the onboarding ("역제안서 작성") flow.
-- Public form: anyone may INSERT (with consent), nobody may read/update/delete via
-- the anon role. Admin/server reads go through service_role (bypasses RLS).

-- gen_random_uuid() is built in on Supabase; this is a harmless safety net.
create extension if not exists pgcrypto;

create table if not exists public.proposal_submissions (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  brand_name          text    not null,
  product_name        text    not null,
  platform            text    not null check (platform in ('instagram','youtube')),
  profile_name        text    not null,
  profile_count       integer not null,
  selected_categories text[]  not null,
  avg_likes           text,
  avg_saves           text,
  avg_shares          text,
  avg_views           text,
  peak_views          integer,
  collab_count        text    not null,
  story_text          text    not null,
  content_types       jsonb   not null,
  content_type_other  text,
  content_tone        text    not null,
  content_tone_other  text,
  expected_price      integer not null,
  reuse_allowed       boolean not null,
  upload_date         text,
  contact_email       text    not null,
  privacy_consent     boolean not null,
  consent_at          timestamptz
);

-- RLS
alter table public.proposal_submissions enable row level security;

-- Defense in depth at the GRANT level: anon may only INSERT; authenticated gets nothing.
-- (service_role bypasses RLS and keeps its own grants — untouched here.)
revoke all on public.proposal_submissions from anon, authenticated;
grant insert on public.proposal_submissions to anon;

-- Anon can INSERT only, and only rows where consent is given.
create policy "anon insert with consent"
  on public.proposal_submissions
  for insert
  to anon
  with check (privacy_consent = true);

-- NO select/update/delete policies are created -> with RLS on, anon is denied
-- read/update/delete by default. Admin reads happen via service_role (bypasses RLS).
