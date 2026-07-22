-- Phase 2-D-2 · 0016 — 역제안 작성/열람 지원
-- 1) get_visible_products: anon 명시 공개(입점 제품 탐색 = 공개 카탈로그).
-- 2) get_my_proposals: 인플루언서 본인 제안 + 대상(캠페인/제품/브랜드) + 결정 열람.
-- 3) 제안 제출 시 연결 지원건 상태 → proposal_sent (인플루언서는 application update RLS가
--    없으므로 definer 트리거로 전이).
-- 의존: 0005/0006/0007/0008/0009. 적용은 운영자(MCP read-only).

-- ── 1) 입점 제품 공개 ────────────────────────────────────────────────────────
grant execute on function public.get_visible_products() to anon;

-- ── 2) get_my_proposals ─────────────────────────────────────────────────────
create or replace function public.get_my_proposals()
returns table (proposal jsonb, target jsonb, decision jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (to_jsonb(ps) - 'contact_email' - 'ship_recipient' - 'ship_phone' - 'ship_address') as proposal,
    jsonb_build_object(
      'target_type', ps.target_type,
      'brand_name', coalesce(cb.brand_name, pb.brand_name, ps.brand_name),
      'product_name', coalesce(cp.name, pp.name, ps.product_name),
      'product_image_url', coalesce(cp.image_url, pp.image_url),
      'campaign_id', ps.campaign_id,
      'product_id', ps.product_id
    ) as target,
    case when d.id is not null then jsonb_build_object(
      'decision', d.decision, 'reasons', d.reasons,
      'nego_discount_pct', d.nego_discount_pct, 'memo', d.memo, 'updated_at', d.updated_at
    ) else null end as decision
  from public.proposal_submissions ps
  left join public.campaigns c  on c.id  = ps.campaign_id
  left join public.brands   cb on cb.id = c.brand_id
  left join public.products cp on cp.id = c.product_id
  left join public.products pp on pp.id = ps.product_id
  left join public.brands   pb on pb.id = pp.brand_id
  left join public.decisions d  on d.proposal_id = ps.id
  where ps.influencer_id = auth.uid()
  order by ps.created_at desc;
$$;
revoke execute on function public.get_my_proposals() from public, anon;
grant execute on function public.get_my_proposals() to authenticated;

-- ── 3) 제안 제출 → 지원건 상태 proposal_sent (definer 트리거) ─────────────────
-- 인플루언서는 campaign_applications를 update할 RLS가 없으므로(브랜드만), 트리거로 전이.
-- 본인 지원건이면서 체험 중일 때만.
create or replace function public.mark_application_proposal_sent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.application_id is not null then
    update public.campaign_applications
      set status = 'proposal_sent'
      where id = new.application_id
        and influencer_id = new.influencer_id
        and status = 'in_trial';
  end if;
  return new;
end;
$$;
revoke execute on function public.mark_application_proposal_sent() from public, anon, authenticated;

drop trigger if exists proposal_marks_application on public.proposal_submissions;
create trigger proposal_marks_application
  after insert on public.proposal_submissions
  for each row execute function public.mark_application_proposal_sent();
