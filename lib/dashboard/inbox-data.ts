import type { SupabaseClient } from "@supabase/supabase-js";
import { exclusionReason, DEFAULT_WEIGHTS, type ScoreBrand, type ScoreWeights } from "@/lib/scoring";
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
// Fit 기준(주입): 캠페인 경유 = 캠페인의 타겟 설정 우선(카테고리는 연결 제품),
//                제품 직접/일반 = 브랜드 프로필 기준. (A2는 실데이터에 오디언스가
//                없어 항상 제외되므로 실질 영향은 category(A1) — 우선순위는 위와 같음)
export async function getInboxItems(supabase: SupabaseClient, userId: string): Promise<InboxItem[]> {
  const { data: brand } = await supabase.from("brands").select("*").eq("id", userId).single();
  const { data: rows } = await supabase.rpc("get_brand_inbox");

  // 대상 캠페인/제품(자기 브랜드) — Fit 기준 계산용
  const [{ data: campaigns }, { data: products }, { data: decisions }] = await Promise.all([
    supabase.from("campaigns").select("id, product_id, target_ages, target_gender, target_locales").eq("brand_id", userId),
    supabase.from("products").select("id, category").eq("brand_id", userId),
    supabase.from("decisions").select("proposal_id, decision, reasons, nego_discount_pct, memo").eq("brand_id", userId),
  ]);

  const campaignById = new Map((campaigns ?? []).map((c) => [c.id, c]));
  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const decByProposal = new Map((decisions ?? []).map((d) => [d.proposal_id, d as RawDecision]));

  const brandCategory: string = brand?.category ?? "뷰티";
  const brandCountries: string[] = brand?.target_countries ?? [];
  const weights: ScoreWeights = (brand?.weights as ScoreWeights) ?? DEFAULT_WEIGHTS;
  const filters = brandFilters(brand ?? { pref_creator_type: null, pref_creator_gender: null, target_countries: null });

  function fitBrand(p: RawProposal): ScoreBrand {
    if (p.campaign_id && campaignById.has(p.campaign_id)) {
      const c = campaignById.get(p.campaign_id)!;
      const cat = (c.product_id && productById.get(c.product_id)?.category) || brandCategory;
      return { category: cat, target_ages: c.target_ages ?? [], target_gender: c.target_gender ?? "여성", target_countries: c.target_locales ?? [] };
    }
    if (p.product_id && productById.has(p.product_id)) {
      return { category: productById.get(p.product_id)!.category || brandCategory, target_ages: [], target_gender: "여성", target_countries: brandCountries };
    }
    return { category: brandCategory, target_ages: [], target_gender: "여성", target_countries: brandCountries };
  }

  return ((rows ?? []) as { proposal: RawProposal; influencer: RawInfluencer; trial_started_at: string | null }[]).map((r) => {
    const p = r.proposal;
    const inf = r.influencer;
    const bp = fitBrand(p);
    const scored = scoreLive(p, inf, r.trial_started_at, bp, weights);
    const visible = passesLiveFilter(scored, inf, filters, bp);
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
      exclusionReason: visible ? null : exclusionReason(scored.proposal, filters, bp),
    };
  });
}

// 사이드바 배지 = 표시(필터 통과) + 미응답 건수.
export const inboxUnreadCount = (items: InboxItem[]) => items.filter((i) => i.visible && !i.decision).length;
