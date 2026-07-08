// Re:Pitch 역제안서 평가 — v1.1 설계서 산출식의 규칙 기반 v1 구현 (순수 함수).
// 각 지표는 자체 max 위에서 점수를 내고, "미수집/제외" 지표는 축에서 빼고 남은
// 배점으로 100 환산한다(A2 미제공, B5 미제공, YT의 B2 등을 동일 방식으로 처리).
import {
  SEED_PROPOSALS,
  DEMO_BRAND,
  type SeedProposal,
  type AudienceStats,
} from "@/components/dashboard/seed-proposals";
import type { DashboardFilters } from "@/components/dashboard/filter-modal";

// 카테고리별 "조회수 1만당 중앙값"(만원) — 초기 수동 벤치마크(설계서 §3.1 A3, §5).
const PRICE_BENCHMARK: Record<string, number> = {
  뷰티: 3.1,
  식품: 2.6,
  "헬스·피트니스": 3.0,
  라이프스타일: 2.8,
  전자기기: 3.5,
  "앱·서비스": 4.0,
  패션: 3.0,
};

// A1 인접 카테고리(간단 매핑, 설계서 §3.1).
const ADJACENCY: Record<string, string[]> = {
  뷰티: ["라이프스타일"],
  라이프스타일: ["뷰티"],
  "헬스·피트니스": ["식품"],
  식품: ["헬스·피트니스"],
};

// B2 구간 점수: 좋아요/저장/공유 범위 라벨 → 점수(각 1~4).
const RANGE_POINTS: Record<string, number> = {
  "1천 미만": 1,
  "1천-1만": 2,
  "1만-10만": 3,
  "10만 이상": 4,
};

export type Indicator = {
  key: string;
  label: string;
  score: number;
  max: number;
  available: boolean;
  note?: string;
  raw?: string;
};
export type Axis = {
  key: "Fit" | "Quality" | "Auth";
  label: string;
  score: number; // 0~100
  indicators: Indicator[];
};
export type PriceInfo = {
  price: number;
  viewsLow: number;
  viewsHigh: number;
  perTenKLow: number;
  perTenKHigh: number;
  benchmark: number;
  deltaPct: number;
};
export type ScoredProposal = {
  proposal: SeedProposal;
  fit: Axis;
  quality: Axis;
  auth: Axis;
  composite: number;
  labels: string[];
  price: PriceInfo;
  trialWeeks: number;
};

export const WEIGHTS = { fit: 0.4, quality: 0.3, auth: 0.3 };

const round1 = (n: number) => Math.round(n * 10) / 10;

function axisFrom(
  key: Axis["key"],
  label: string,
  indicators: Indicator[],
): Axis {
  const avail = indicators.filter((i) => i.available);
  const maxSum = avail.reduce((s, i) => s + i.max, 0);
  const scoreSum = avail.reduce((s, i) => s + i.score, 0);
  return {
    key,
    label,
    score: maxSum > 0 ? round1((scoreSum / maxSum) * 100) : 0,
    indicators,
  };
}

function genderCoef(stats: AudienceStats, target: "여성" | "남성") {
  const r = target === "여성" ? stats.gender.여성 : stats.gender.남성;
  return r >= 0.6 ? 1.0 : r >= 0.4 ? 0.7 : 0.3;
}

function trialWeeks(p: SeedProposal) {
  const ms =
    new Date(p.created_at).getTime() - new Date(p.trial_received_at).getTime();
  return Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)));
}

// ── A. Fit ──────────────────────────────────────────────────────────
function fitAxis(p: SeedProposal): Axis {
  const brandCat = DEMO_BRAND.category;
  const cats = p.selected_categories;

  // A1 카테고리 일치 (35 / 인접 18 / 불일치 0)
  let a1 = 0;
  if (cats.includes(brandCat)) a1 = 35;
  else if (cats.some((c) => (ADJACENCY[brandCat] || []).includes(c))) a1 = 18;
  const A1: Indicator = {
    key: "A1",
    label: "카테고리 적합",
    score: a1,
    max: 35,
    available: true,
    raw: `제안 ${cats.join(", ")} vs 브랜드 ${brandCat}`,
  };

  // A2 오디언스 겹침 = Σ(타겟 연령 비율) × 성별계수 × 35 (오디언스 데이터 있을 때만)
  let A2: Indicator;
  if (p.audience_stats) {
    const inTarget = DEMO_BRAND.targetAges.reduce(
      (s, a) => s + (p.audience_stats!.age[a] || 0),
      0,
    );
    const coef = genderCoef(p.audience_stats, DEMO_BRAND.targetGender);
    A2 = {
      key: "A2",
      label: "타겟 고객 일치",
      score: round1(inTarget * coef * 35),
      max: 35,
      available: true,
      raw: `타겟연령 ${Math.round(inTarget * 100)}% · 성별계수 ${coef}`,
    };
  } else {
    A2 = {
      key: "A2",
      label: "타겟 고객 일치",
      score: 0,
      max: 35,
      available: false,
      note: "타겟 고객 데이터 없음 (점수에서 제외)",
    };
  }

  // A3 단가 적정성 (1만뷰당 단가 vs 카테고리 중앙값; ≤중앙값 30 → 150% 초과 0)
  const perTenK = p.expected_price / (p.peak_views / 10000);
  const bench = PRICE_BENCHMARK[cats[0]] ?? 3.0;
  const ratio = perTenK / bench;
  const a3 = ratio <= 1 ? 30 : ratio >= 1.5 ? 0 : 30 * (1 - (ratio - 1) / 0.5);
  const A3: Indicator = {
    key: "A3",
    label: "단가 적정성",
    score: round1(a3),
    max: 30,
    available: true,
    raw: `1만뷰당 ${perTenK.toFixed(1)}만원 / 중앙값 ${bench}만원`,
  };

  return axisFrom("Fit", "적합도", [A1, A2, A3]);
}

// ── B. Quality ──────────────────────────────────────────────────────
function qualityAxis(p: SeedProposal, pool: SeedProposal[]): Axis {
  const isIG = p.platform === "instagram";

  // B1 성과 효율 = (조회수/팔로워) 시드 풀 내 백분위
  const sorted = pool
    .map((x) => x.peak_views / x.profile_count)
    .sort((a, b) => a - b);
  const myR = p.peak_views / p.profile_count;
  const below = sorted.filter((x) => x < myR).length;
  const pct = sorted.length > 1 ? below / (sorted.length - 1) : 1;
  const b1Max = isIG ? 30 : 40; // YT: B2 제외분 +10
  const B1: Indicator = {
    key: "B1",
    label: "성과 효율",
    score: round1(pct * b1Max),
    max: b1Max,
    available: true,
    raw: `조회수/팔로워 ${myR.toFixed(2)} · 상위 ${Math.round(pct * 100)}%`,
  };

  // B2 참여 질 — IG만. 댓글 품질(10)은 데이터 없음 → 구간점수(20)만 내부 환산.
  //   YT는 IG 지표(좋아요/저장/공유)가 없어 축에서 제외하고 그 배점을 B1·B5에 분산(합의).
  let B2: Indicator;
  if (isIG) {
    const pts =
      (RANGE_POINTS[p.avg_likes || ""] || 0) +
      (RANGE_POINTS[p.avg_saves || ""] || 0) +
      (RANGE_POINTS[p.avg_shares || ""] || 0);
    const seg = (pts / 12) * 20;
    B2 = {
      key: "B2",
      label: "팔로워 반응",
      score: round1((seg / 20) * 30),
      max: 30,
      available: true,
      note: "댓글 데이터 없음 → 반응 지표로만 평가",
      raw: `좋아요·저장·공유 구간합 ${pts}/12`,
    };
  } else {
    B2 = {
      key: "B2",
      label: "팔로워 반응",
      score: 0,
      max: 30,
      available: false,
      note: "YouTube 참여 지표 없음 → 성과·성장세에 반영",
    };
  }

  // B4 콘텐츠 일관성 = 큐레이터 라벨 1~5
  const B4: Indicator = {
    key: "B4",
    label: "콘텐츠 일관성",
    score: round1((p.b4.rating / 5) * 20),
    max: 20,
    available: true,
    raw: `큐레이터 ${p.b4.rating}/5`,
  };

  // B5 최근 추세 = 최근 30일 조회수 / 기존 (있을 때만)
  let B5: Indicator;
  const b5Max = isIG ? 20 : 30; // YT: +10
  if (p.recent_views_30d != null) {
    const r = p.recent_views_30d / p.peak_views;
    const s20 = r >= 1.1 ? 20 : r >= 1.0 ? 16 : r >= 0.9 ? 12 : r >= 0.8 ? 8 : 4;
    B5 = {
      key: "B5",
      label: "최근 성장세",
      score: round1((s20 / 20) * b5Max),
      max: b5Max,
      available: true,
      raw: `최근30일/기존 ${Math.round(r * 100)}%`,
    };
  } else {
    B5 = {
      key: "B5",
      label: "최근 성장세",
      score: 0,
      max: b5Max,
      available: false,
      note: "최근 성장세 데이터 없음 (점수에서 제외)",
    };
  }

  return axisFrom("Quality", "크리에이터 역량", [B1, B2, B4, B5]);
}

// ── C. Authenticity ────────────────────────────────────────────────
function authAxis(p: SeedProposal): Axis {
  const weeks = trialWeeks(p);
  const c1 = weeks >= 8 ? 30 : weeks >= 4 ? 20 : weeks >= 2 ? 10 : 5;
  const C1: Indicator = {
    key: "C1",
    label: "제품 사용 기간",
    score: c1,
    max: 30,
    available: true,
    raw: `체험 ${weeks}주차`,
  };
  // C2~C4: 실서비스에선 LLM이 채우는 자리. 데모는 시드 사전값 사용.
  const C2: Indicator = {
    key: "C2",
    label: "경험의 구체성",
    score: p.c2.score,
    max: 30,
    available: true,
    note: "AI 분석값 (데모)",
  };
  const C3: Indicator = {
    key: "C3",
    label: "제안 동기",
    score: p.c3.score,
    max: 25,
    available: true,
    note: "AI 분석값 (데모)",
  };
  const C4: Indicator = {
    key: "C4",
    label: "채널과의 어울림",
    score: p.c4.score,
    max: 15,
    available: true,
    note: "AI 분석값 (데모)",
  };
  return axisFrom("Auth", "진정성", [C1, C2, C3, C4]);
}

function priceInfo(p: SeedProposal): PriceInfo {
  const viewsHigh = p.peak_views;
  const viewsLow = Math.round(p.peak_views * 0.55);
  const perTenKLow = p.expected_price / (viewsHigh / 10000); // 뷰 많을수록 저렴
  const perTenKHigh = p.expected_price / (viewsLow / 10000);
  const bench = PRICE_BENCHMARK[p.selected_categories[0]] ?? 3.0;
  // 비교 %는 단가 적정성(A3)과 동일 기준(1만뷰당 단가 vs 카테고리 중앙값)으로 일관화.
  const perTenK = p.expected_price / (p.peak_views / 10000);
  return {
    price: p.expected_price,
    viewsLow,
    viewsHigh,
    perTenKLow: round1(perTenKLow),
    perTenKHigh: round1(perTenKHigh),
    benchmark: bench,
    deltaPct: Math.round((perTenK / bench - 1) * 100),
  };
}

export function scoreProposal(
  p: SeedProposal,
  pool: SeedProposal[] = SEED_PROPOSALS,
): ScoredProposal {
  const fit = fitAxis(p);
  const quality = qualityAxis(p, pool);
  const auth = authAxis(p);
  const composite = round1(
    fit.score * WEIGHTS.fit +
      quality.score * WEIGHTS.quality +
      auth.score * WEIGHTS.auth,
  );
  const labels = [
    ...new Set(
      [fit, quality, auth]
        .flatMap((a) => a.indicators)
        .filter((i) => !i.available && i.note)
        .map((i) => i.note as string),
    ),
  ];
  return { proposal: p, fit, quality, auth, composite, labels, price: priceInfo(p), trialWeeks: trialWeeks(p) };
}

export function scoreAll(pool: SeedProposal[] = SEED_PROPOSALS): ScoredProposal[] {
  return pool
    .map((p) => scoreProposal(p, pool))
    .sort((a, b) => b.composite - a.composite);
}

export function passesFilters(p: SeedProposal, f: DashboardFilters): boolean {
  if (f.creatorType !== "상관없음" && p.creator_type !== f.creatorType) return false;
  if (f.gender !== "상관없음" && p.creator_gender !== f.gender) return false;
  if (!f.countries.includes("상관없음")) {
    if (!p.audience_country.some((c) => f.countries.includes(c))) return false;
  }
  return true;
}

/*
 산출식 손계산 검증 (시드 풀 = 7건 기준):

 ▸ p1 (뷰티·IG·32k팔·95k뷰·30만·오디언스 있음)
   Fit  : A1=35(뷰티 일치), A2=(0.45+0.30)×1.0×35=26.25, A3: 1만뷰당 30/9.5=3.16 /3.1=1.02
          → 30×(1-0.02/0.5)=28.9 · avail max 100 → 90.1
   Quality: B1 백분위 100%×30=30, B2 구간(3+2+2=7/12→11.67)→17.5, B4 5/5→20,
            B5 121%→20 · max 100 → 87.5
   Auth : C1 체험 8주+→30, C2 27, C3 22, C4 13 · max 100 → 92
   종합 : 90.1×0.4 + 87.5×0.3 + 92×0.3 ≈ 89.9

 ▸ p4 (헬스·IG·21k팔·40k뷰·60만·추세 없음)  ← 단가 과다 + 상투어
   Fit  : A1=0(헬스↔뷰티 인접 아님), A2=(0.5+0.3)×0.3×35=8.4, A3: 60/4=15 /3.0=5.0 → 0
          → 8.4
   Quality: B1 백분위 33%×30=10, B2 구간(3+2+1=6/12→10)→15, B4 2/5→8, B5 제외
            → (10+15+8)/(30+30+20)×100 = 41.25
   Auth : C1 체험 2주→10, C2 12, C3 8(상투어), C4 6 → 36
   종합 : 8.4×0.4 + 41.25×0.3 + 36×0.3 ≈ 26.5
*/
