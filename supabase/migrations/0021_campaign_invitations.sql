-- Phase 3-(d) · 0021 — 캠페인 초대(브랜드 → 인플루언서). campaign_applications(신청)의 역방향.
-- 별도 테이블로 분리(점수 엔진·다른 화면 불변). 수락 시 campaign_applications(selected) 생성.
-- 의존: 0004(influencers)·0005(brands)·0006(campaigns)·0007(applications). 적용은 운영자.

create table if not exists public.campaign_invitations (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns(id)    on delete cascade,
  influencer_id uuid not null references public.influencers(id)  on delete cascade,
  brand_id      uuid not null references public.brands(id)       on delete cascade,
  message       text,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  unique (campaign_id, influencer_id)   -- 중복 초대 방지
);

comment on table public.campaign_invitations is '브랜드가 인플루언서를 자기 캠페인으로 초대. 수락 시 campaign_applications(selected) 생성.';
create index if not exists campaign_invitations_influencer_idx on public.campaign_invitations (influencer_id);
create index if not exists campaign_invitations_campaign_idx on public.campaign_invitations (campaign_id);

alter table public.campaign_invitations enable row level security;

-- 브랜드: 자기 캠페인 초대만 생성(brand_id 본인 + 캠페인 소유).
drop policy if exists invitations_insert_brand on public.campaign_invitations;
create policy invitations_insert_brand on public.campaign_invitations for insert
  to authenticated
  with check (
    brand_id = auth.uid()
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid())
  );

-- 브랜드: 자기가 보낸 초대 조회(카운트용).
drop policy if exists invitations_select_brand on public.campaign_invitations;
create policy invitations_select_brand on public.campaign_invitations for select
  to authenticated using (brand_id = auth.uid());

-- 인플루언서: 자기가 받은 초대 조회.
drop policy if exists invitations_select_influencer on public.campaign_invitations;
create policy invitations_select_influencer on public.campaign_invitations for select
  to authenticated using (influencer_id = auth.uid());

-- 인플루언서: 본인 응답만(accepted/declined). 트리거로 status 외 변경 방지.
drop policy if exists invitations_update_influencer on public.campaign_invitations;
create policy invitations_update_influencer on public.campaign_invitations for update
  to authenticated
  using (influencer_id = auth.uid())
  with check (influencer_id = auth.uid() and status in ('accepted', 'declined'));

-- 응답 시 인플루언서가 status·responded_at 외 필드를 못 바꾸게 고정.
create or replace function public.protect_invitation_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is distinct from old.brand_id then
    new.campaign_id := old.campaign_id;
    new.influencer_id := old.influencer_id;
    new.brand_id := old.brand_id;
    new.message := old.message;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
revoke execute on function public.protect_invitation_fields() from public, anon, authenticated;
drop trigger if exists protect_invitation_fields_update on public.campaign_invitations;
create trigger protect_invitation_fields_update
  before update on public.campaign_invitations
  for each row execute function public.protect_invitation_fields();

grant select, insert, update on public.campaign_invitations to authenticated;

-- ── 브랜드 디렉토리: 인플루언서 공개 프로필 목록(RLS로 막힌 타인 influencers 조인 대체) ──
-- PII(배송지)·토큰 제외, 공개 프로필만. 초대 진입점용.
create or replace function public.get_influencers()
returns table (id uuid, display_name text, channels jsonb, category text[], creator_type text, gender text, countries text[])
language sql stable security definer set search_path = ''
as $$
  select i.id, i.display_name, i.channels, i.category, i.creator_type, i.gender, i.countries
  from public.influencers i
  where i.display_name is not null
  order by i.display_name;
$$;
revoke execute on function public.get_influencers() from public, anon;
grant execute on function public.get_influencers() to authenticated;

-- ── 인플루언서: 받은 초대 + 캠페인/브랜드/제품 맥락(RLS로 막힌 조인 대체) ──
create or replace function public.get_my_invitations()
returns table (invitation jsonb, campaign jsonb)
language sql stable security definer set search_path = ''
as $$
  select
    jsonb_build_object('id', v.id, 'message', v.message, 'status', v.status, 'created_at', v.created_at) as invitation,
    jsonb_build_object(
      'campaign_id', c.id, 'goal', c.goal, 'brand_name', b.brand_name,
      'product_name', p.name, 'product_image_url', p.image_url,
      'offer_type', c.offer_type, 'deal_mode', c.deal_mode, 'deal_value', c.deal_value, 'trial_weeks', c.trial_weeks
    ) as campaign
  from public.campaign_invitations v
  join public.campaigns c on c.id = v.campaign_id
  left join public.brands b on b.id = v.brand_id
  left join public.products p on p.id = c.product_id
  where v.influencer_id = auth.uid()
  order by v.created_at desc;
$$;
revoke execute on function public.get_my_invitations() from public, anon;
grant execute on function public.get_my_invitations() to authenticated;
