import type { ScoreWeights } from "@/lib/scoring";

// 업종별 추천 평가 가중치 초안 (합 100). fit=적합도 / quality=크리에이터 역량 / auth=진정성.
// ⚠️ 기획 검토 대기 — 초안값. 브랜드는 설정에서 언제든 조정 가능.
export const RECOMMENDED_WEIGHTS: Record<string, ScoreWeights> = {
  뷰티: { fit: 35, quality: 25, auth: 40 },
  패션: { fit: 35, quality: 25, auth: 40 },
  식품: { fit: 40, quality: 30, auth: 30 },
  "헬스·피트니스": { fit: 40, quality: 35, auth: 25 },
  라이프스타일: { fit: 35, quality: 30, auth: 35 },
  "앱·서비스": { fit: 40, quality: 40, auth: 20 },
  전자기기: { fit: 40, quality: 40, auth: 20 },
};

// 매핑 없는 카테고리 → 기본 40/30/30.
export const DEFAULT_RECOMMENDED: ScoreWeights = { fit: 40, quality: 30, auth: 30 };

export function recommendedWeights(category: string | null | undefined): ScoreWeights {
  return (category && RECOMMENDED_WEIGHTS[category]) || DEFAULT_RECOMMENDED;
}
