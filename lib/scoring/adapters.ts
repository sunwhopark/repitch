// 실서비스 어댑터 — 실 proposal_submissions(+influencers) 행을 점수 엔진 입력
// (SeedProposal)으로 변환하고, 엔진 출력(ScoredProposal)을 후처리한다.
// 엔진(lib/scoring/index.ts) 로직은 불변 — 여기서 입력 매핑 + 출력 변환만 한다.
//
// C축(C2~C4)·B4는 LLM/큐레이터 파이프라인 전 단계라 사전값이 없다. 엔진은 이들을
// 항상 available:true로 계산하므로(제외 경로 없음), 여기서 엔진 실행 후 해당 지표를
// available:false로 표시하고 축·종합점수를 재환산한다(엔진의 미수집 규칙과 동일한 공식).
//   → Phase 3에서 LLM 파이프라인 연동 시 이 후처리를 제거하고 실값을 넣는다.

import { scoreProposal, WEIGHTS, passesFilters, type ScoredProposal, type Indicator, type Axis } from "@/lib/scoring";
import type { SeedProposal, ContentPlan } from "@/components/dashboard/seed-proposals";
import type { DecisionRecord } from "@/components/dashboard/proposal-detail";
import type { DashboardFilters } from "@/components/dashboard/filter-modal";

const round1 = (n: number) => Math.round(n * 10) / 10;

// ── 실 행 타입(rpc get_brand_inbox의 jsonb 파싱 결과) ─────────────────────────
export type RawProposal = {
  id: string;
  created_at: string;
  brand_name: string;
  product_name: string;
  platform: string; // instagram | youtube | tiktok
  profile_name: string;
  profile_count: number | null;
  selected_categories: string[] | null;
  avg_likes: string | null;
  avg_saves: string | null;
  avg_shares: string | null;
  avg_views: string | null;
  peak_views: number | null;
  collab_count: string | null;
  story_text: string | null;
  content_types: ContentPlan[] | null;
  content_type_other: string | null;
  content_tone: string | null;
  expected_price: number | null;
  reuse_allowed: boolean | null;
  upload_date: string | null;
  target_type: "campaign" | "product" | "general";
  campaign_id: string | null;
  product_id: string | null;
  application_id: string | null;
};

export type RawInfluencer = {
  id: string;
  display_name: string | null;
  creator_type: "실물" | "버추얼" | null;
  gender: "여성" | "남성" | null;
  countries: string[] | null;
  channels: { platform?: string; handle?: string; follower_count?: number; avg_views?: number }[] | null;
} | null;

export type RawDecision = {
  proposal_id: string;
  decision: "rejected" | "negotiating" | "accepted";
  reasons: string[] | null;
  nego_discount_pct: number | null;
  memo: string | null;
} | null;

// 브랜드 선호 설정 → 하드필터. null/빈 값은 "상관없음"으로.
export function brandFilters(brand: {
  pref_creator_type: string | null;
  pref_creator_gender: string | null;
  target_countries: string[] | null;
}): DashboardFilters {
  return {
    creatorType: brand.pref_creator_type || "상관없음",
    gender: brand.pref_creator_gender || "상관없음",
    countries: brand.target_countries && brand.target_countries.length ? brand.target_countries : ["상관없음"],
  };
}

// 회원 프로필 존재 여부(비회원 제출은 creator_type/gender/country 없음 → 필터 제외 안 함).
export const hasProfile = (inf: RawInfluencer) => !!(inf && inf.creator_type && inf.gender);

// 실 proposal(+influencer) → SeedProposal(엔진 입력).
// trialStartedAt: 캠페인 지원건의 발송/수령/선정 시각(체험 시작). 없으면 제출일 폴백.
export function proposalToSeed(p: RawProposal, inf: RawInfluencer, trialStartedAt: string | null): SeedProposal {
  const platform: "instagram" | "youtube" = p.platform === "youtube" ? "youtube" : "instagram"; // tiktok→IG 취급(엔진 미지원)
  return {
    id: p.id,
    status: "신규",
    brand_name: p.brand_name,
    product_name: p.product_name,
    platform,
    profile_name: p.profile_name,
    profile_url: platform === "youtube" ? "https://www.youtube.com" : "https://www.instagram.com",
    profile_count: p.profile_count ?? 0,
    selected_categories: p.selected_categories ?? [],
    avg_likes: p.avg_likes ?? undefined,
    avg_saves: p.avg_saves ?? undefined,
    avg_shares: p.avg_shares ?? undefined,
    avg_views: p.avg_views ?? undefined,
    peak_views: p.peak_views ?? 0,
    collab_count: p.collab_count ?? "0회",
    story_text: p.story_text ?? "",
    content_types: Array.isArray(p.content_types) ? p.content_types : [],
    content_type_other: p.content_type_other,
    content_tone: p.content_tone ?? "",
    expected_price: p.expected_price ?? 0,
    reuse_allowed: p.reuse_allowed ?? false,
    upload_date: p.upload_date ?? "",
    created_at: p.created_at,
    // 회원 프로필(필터용). 비회원은 플레이스홀더(필터에서 제외 처리하므로 값 무의미).
    creator_type: inf?.creator_type ?? "실물",
    creator_gender: inf?.gender ?? "여성",
    audience_country: inf?.countries ?? [],
    // 미수집 → 엔진이 A2/B5 자동 제외
    audience_stats: undefined,
    recent_views_30d: undefined,
    trial_received_at: trialStartedAt ?? p.created_at,
    // LLM/큐레이터 미연동 → 플레이스홀더(후처리에서 제외되어 점수 미반영). evidence는 빈 배열.
    b4: { rating: 3, comment: "" },
    c2: { level: 0, score: 0, evidence: [] },
    c3: { level: 0, score: 0, evidence: [], ad_speak_flags: [] },
    c4: { level: 0, score: 0, evidence: [] },
  };
}

// 축을 available 지표만으로 재환산(엔진 axisFrom과 동일 공식).
function rescale(indicators: Indicator[]): number {
  const avail = indicators.filter((i) => i.available);
  const maxSum = avail.reduce((s, i) => s + i.max, 0);
  const scoreSum = avail.reduce((s, i) => s + i.score, 0);
  return maxSum > 0 ? round1((scoreSum / maxSum) * 100) : 0;
}

const PENDING_C = "AI 분석 대기 (Phase 3)";
const PENDING_B4 = "큐레이션 대기";
const A3_NOTE = "단가 벤치마크 · 데이터 축적 중";

// 엔진 출력 후처리 — C2~C4·B4 제외+환산, A3 소주석, 종합점수·labels 재계산.
export function applyPendingExclusions(s: ScoredProposal): ScoredProposal {
  const auth: Axis = { ...s.auth, indicators: s.auth.indicators.map((i) => (["C2", "C3", "C4"].includes(i.key) ? { ...i, available: false, note: PENDING_C } : i)) };
  auth.score = rescale(auth.indicators);

  const quality: Axis = { ...s.quality, indicators: s.quality.indicators.map((i) => (i.key === "B4" ? { ...i, available: false, note: PENDING_B4 } : i)) };
  quality.score = rescale(quality.indicators);

  const fit: Axis = { ...s.fit, indicators: s.fit.indicators.map((i) => (i.key === "A3" && i.available ? { ...i, note: i.note ?? A3_NOTE } : i)) };

  const composite = round1(fit.score * WEIGHTS.fit + quality.score * WEIGHTS.quality + auth.score * WEIGHTS.auth);
  const labels = Array.from(
    new Set([...fit.indicators, ...quality.indicators, ...auth.indicators].filter((i) => !i.available && i.note).map((i) => i.note as string)),
  );
  return { ...s, fit, quality, auth, composite, labels };
}

// 실 proposal → 후처리된 ScoredProposal.
export function scoreLive(p: RawProposal, inf: RawInfluencer, trialStartedAt: string | null): ScoredProposal {
  return applyPendingExclusions(scoreProposal(proposalToSeed(p, inf, trialStartedAt)));
}

// 회원건만 하드필터 적용. 비회원(프로필 없음)은 항상 통과(과잉 필터 방지).
export function passesLiveFilter(scored: ScoredProposal, inf: RawInfluencer, filters: DashboardFilters): boolean {
  if (!hasProfile(inf)) return true;
  return passesFilters(scored.proposal, filters);
}

// ── decisions 행 ⇄ UI DecisionRecord ─────────────────────────────────────────
export function decisionRecordFromRow(d: RawDecision): DecisionRecord | null {
  if (!d) return null;
  if (d.decision === "rejected") return { decision: "거절", rejectReasons: d.reasons ?? [] };
  if (d.decision === "accepted") return { decision: "수락" };
  return { decision: "협의", negoReason: d.reasons?.[0], discount: d.nego_discount_pct ?? undefined, memo: d.memo ?? undefined };
}

export function decisionRowFromRecord(rec: DecisionRecord, proposalId: string, brandId: string) {
  const base = { proposal_id: proposalId, brand_id: brandId };
  if (rec.decision === "거절") return { ...base, decision: "rejected", reasons: rec.rejectReasons ?? [], nego_discount_pct: null, memo: null };
  if (rec.decision === "수락") return { ...base, decision: "accepted", reasons: [], nego_discount_pct: null, memo: null };
  return { ...base, decision: "negotiating", reasons: rec.negoReason ? [rec.negoReason] : [], nego_discount_pct: rec.discount ?? null, memo: rec.memo ?? null };
}
