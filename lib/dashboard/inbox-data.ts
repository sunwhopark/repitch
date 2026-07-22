import type { SupabaseClient } from "@supabase/supabase-js";
import { exclusionReason } from "@/lib/scoring";
import {
  scoreLive,
  decisionRecordFromRow,
  brandFilters,
  passesLiveFilter,
  hasProfile,
  type RawProposal,
  type RawInfluencer,
  type RawDecision,
} from "@/lib/scoring/adapters";
import type { InboxItem } from "@/components/dashboard/live/inbox-client";

// 서버 공용 — 브랜드 인박스 아이템 구성(정의 함수 + 점수 + decisions 병합).
// 인박스 페이지와 레이아웃(사이드바 배지)이 함께 사용.
export async function getInboxItems(supabase: SupabaseClient, userId: string): Promise<InboxItem[]> {
  const { data: brand } = await supabase
    .from("brands")
    .select("pref_creator_type, pref_creator_gender, target_countries")
    .eq("id", userId)
    .single();

  const { data: rows } = await supabase.rpc("get_brand_inbox");
  const { data: decisions } = await supabase
    .from("decisions")
    .select("proposal_id, decision, reasons, nego_discount_pct, memo")
    .eq("brand_id", userId);

  const decByProposal = new Map((decisions ?? []).map((d) => [d.proposal_id, d as RawDecision]));
  const filters = brandFilters(brand ?? { pref_creator_type: null, pref_creator_gender: null, target_countries: null });

  return ((rows ?? []) as { proposal: RawProposal; influencer: RawInfluencer; trial_started_at: string | null }[]).map((r) => {
    const p = r.proposal;
    const inf = r.influencer;
    const scored = scoreLive(p, inf, r.trial_started_at);
    const visible = passesLiveFilter(scored, inf, filters);
    return {
      scored,
      id: p.id,
      campaignId: p.campaign_id,
      productId: p.product_id,
      targetType: p.target_type,
      hasProfile: hasProfile(inf),
      displayName: inf?.display_name ?? p.profile_name,
      decision: decisionRecordFromRow(decByProposal.get(p.id) ?? null),
      visible,
      exclusionReason: visible ? null : exclusionReason(scored.proposal, filters),
    };
  });
}

// 사이드바 배지 = 표시(필터 통과) + 미응답 건수.
export const inboxUnreadCount = (items: InboxItem[]) => items.filter((i) => i.visible && !i.decision).length;
