-- Phase 2-A · 0007 — campaign_applications 테이블 + 필드 보호 트리거
-- 목적: 인플루언서의 캠페인 지원. 배송지는 지원 시점 스냅샷(이후 프로필 변경 무관).
-- 의존: 0006(campaigns), 0004(influencers).

create table if not exists public.campaign_applications (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  campaign_id            uuid not null references public.campaigns (id) on delete cascade,
  influencer_id          uuid not null references public.influencers (id) on delete cascade,
  -- 배송지 스냅샷 (지원 시점 복사)
  ship_recipient         text,
  ship_phone             text,
  ship_address           text,
  third_party_consent_at timestamptz not null,   -- 제3자 제공 동의(문구 ②) 시각 — 필수
  status                 text not null default 'applied'
                           check (status = any (array['applied','selected','held','shipped','in_trial','proposal_sent','not_selected'])),
  hold_reason            text,
  hold_memo              text,
  courier                text,
  tracking_no            text,
  selected_at            timestamptz,
  shipped_at             timestamptz,
  delivered_at           timestamptz,
  unique (campaign_id, influencer_id)            -- 중복 지원 방지
);

comment on table public.campaign_applications is '캠페인 지원 건. 인플루언서 소유 필드(배송지·동의)는 브랜드가 수정 불가(트리거 보호).';

-- ── 필드 보호: 브랜드가 상태·송장만 바꾸고 인플루언서 소유 필드는 못 바꾸게 ─────
-- 소유자(인플루언서) 외의 UPDATE(=브랜드)면 인플루언서 소유 컬럼을 OLD로 고정.
create or replace function public.protect_application_owner_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is distinct from old.influencer_id then
    new.influencer_id          := old.influencer_id;
    new.campaign_id            := old.campaign_id;
    new.ship_recipient         := old.ship_recipient;
    new.ship_phone             := old.ship_phone;
    new.ship_address           := old.ship_address;
    new.third_party_consent_at := old.third_party_consent_at;
    new.created_at             := old.created_at;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_application_owner_fields() from public, anon, authenticated;

drop trigger if exists protect_application_owner_fields_update on public.campaign_applications;
create trigger protect_application_owner_fields_update
  before update on public.campaign_applications
  for each row execute function public.protect_application_owner_fields();

-- ── RLS: 인플루언서(본인 insert+select) / 브랜드(자기 캠페인 select+update) ─────
alter table public.campaign_applications enable row level security;

-- 인플루언서: 본인 건 조회
drop policy if exists applications_select_influencer on public.campaign_applications;
create policy applications_select_influencer on public.campaign_applications for select
  to authenticated using (influencer_id = auth.uid());

-- 인플루언서: 본인 지원 생성 + 제3자 동의 시각 필수
drop policy if exists applications_insert_influencer on public.campaign_applications;
create policy applications_insert_influencer on public.campaign_applications for insert
  to authenticated
  with check (influencer_id = auth.uid() and third_party_consent_at is not null);

-- 브랜드: 자기 캠페인의 지원 건 조회
drop policy if exists applications_select_brand on public.campaign_applications;
create policy applications_select_brand on public.campaign_applications for select
  to authenticated
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid()));

-- 브랜드: 자기 캠페인의 지원 건 수정(상태·송장 — 소유 필드는 트리거가 보호)
drop policy if exists applications_update_brand on public.campaign_applications;
create policy applications_update_brand on public.campaign_applications for update
  to authenticated
  using (exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid()))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid()));
