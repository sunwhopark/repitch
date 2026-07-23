-- Phase 3-(c) · 0019 — LLM 진정성(C2~C4) 평가 결과 저장
-- proposal_submissions에 평가 컬럼 추가 + 결과 기록용 definer(권한 체크 내장).
-- proposal_submissions는 UPDATE RLS 정책이 없어(0008: select/insert만) 일반 세션으로
-- 갱신 불가 → 대상 브랜드/제출자만 갱신하는 SECURITY DEFINER 함수로 기록한다.
-- get_brand_inbox(0012)는 to_jsonb(p)로 반환하므로 아래 컬럼이 자동 포함됨(정의 변경 불필요).
-- 의존: 0008(RLS). 적용은 운영자(MCP read-only).

alter table public.proposal_submissions
  add column if not exists auth_scores jsonb,
  add column if not exists auth_evaluated_at timestamptz,
  add column if not exists auth_model text,
  add column if not exists auth_status text not null default 'pending';

alter table public.proposal_submissions drop constraint if exists proposal_submissions_auth_status_check;
alter table public.proposal_submissions
  add constraint proposal_submissions_auth_status_check
  check (auth_status in ('pending', 'done', 'failed'));

comment on column public.proposal_submissions.auth_scores is
  'LLM 진정성 평가: {c2:{score,quotes[],rationale}, c3:{score,quotes[],rationale,flags[]}, c4:{score,quotes[],rationale}} (score 0~100)';

-- 결과 기록 — 대상 브랜드(자기 캠페인/제품) 또는 제출 인플루언서 본인만.
create or replace function public.set_auth_scores(
  p_proposal_id uuid, p_scores jsonb, p_model text, p_status text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('pending', 'done', 'failed') then
    raise exception 'invalid status';
  end if;
  if not exists (
    select 1 from public.proposal_submissions ps
    where ps.id = p_proposal_id and (
      ps.influencer_id = auth.uid()
      or (ps.campaign_id is not null and exists (select 1 from public.campaigns c where c.id = ps.campaign_id and c.brand_id = auth.uid()))
      or (ps.product_id  is not null and exists (select 1 from public.products  pr where pr.id = ps.product_id  and pr.brand_id = auth.uid()))
    )
  ) then
    raise exception 'not authorized';
  end if;

  update public.proposal_submissions
    set auth_scores = case when p_status = 'done' then p_scores else auth_scores end,
        auth_model = p_model,
        auth_status = p_status,
        auth_evaluated_at = case when p_status = 'done' then now() else auth_evaluated_at end
    where id = p_proposal_id;
end;
$$;

revoke execute on function public.set_auth_scores(uuid, jsonb, text, text) from public, anon;
grant execute on function public.set_auth_scores(uuid, jsonb, text, text) to authenticated;
