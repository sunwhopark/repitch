// Demo seed for the 정산(Settlement) page. 100% dummy. Reconciled with the
// rest of the 세계관:
//   · seoyeon.skin(p1, 데일리 토너) — 인박스에서 수락된 역제안 → "정산 예정"
//   · 수분 크림 체험단(cream, 종료)의 크리에이터 → "지급 완료"
//   · 해외 인플루언서 2명(가상, 영문 핸들) — PayPal 지급
// Replace with real queries (settlements 테이블 + 지급 대행 웹훅) later.

// 데모 클럭이 2026-07-16이라 "이번 달"은 2026-07. 완료 건 paidDate는 전부 이 달.
export const THIS_MONTH = "2026-07";

// 플랫폼 수수료율. 실서비스: 계약·구간별로 달라질 수 있어 행에 스냅샷으로 저장 예정.
export const FEE_RATE = 0.05;

export type SettlementStatus = "정산 예정" | "지급 완료";

export type Settlement = {
  id: string;
  name: string; // 표시 이름
  handle: string; // @handle
  campaign: string; // 캠페인명(product)
  campaignId: string; // 캠페인 상세 링크
  region: "국내" | "해외";
  amount: number; // 정산 금액(원) — 세전
  status: SettlementStatus;
  dueDate?: string; // 정산 예정: 지급 예정일
  paidDate?: string; // 지급 완료: 완료일
  // 지급 계좌/수단 — 실서비스에서도 마스킹만 노출(원문 미저장·미표시 원칙).
  bankMasked?: string; // 국내: "국민 --1234 · 예금주 서연"
  paypalMasked?: string; // 해외: "e•••@gmail.com"
  // NOTE: 주민등록번호 등 세금 식별정보는 넣지 않음 — 법령 근거 없는 수집 금지로
  // 미보관 방침. 세금 처리는 정산 대행 연동 또는 지급 시점 수집으로 — 기획 결정 대기.
};

export const SETTLEMENTS: Settlement[] = [
  // ── 국내 ─────────────────────────────────────────────────────────
  {
    id: "st-seoyeon", name: "서연", handle: "@seoyeon.skin",
    campaign: "데일리 토너 체험단", campaignId: "toner", region: "국내",
    amount: 300000, status: "정산 예정", dueDate: "2026-07-25",
    bankMasked: "국민 --1234 · 예금주 서연",
  },
  {
    id: "st-mina", name: "미나", handle: "@mina.gloss",
    campaign: "수분 크림 체험단", campaignId: "cream", region: "국내",
    amount: 250000, status: "지급 완료", paidDate: "2026-07-05",
    bankMasked: "신한 --2847 · 예금주 미나",
  },
  {
    id: "st-ruby", name: "루비", handle: "@ruby.care",
    campaign: "수분 크림 체험단", campaignId: "cream", region: "국내",
    amount: 200000, status: "지급 완료", paidDate: "2026-07-05",
    bankMasked: "카카오뱅크 --5510 · 예금주 루비",
  },
  {
    id: "st-serim", name: "세림", handle: "@serim.skin",
    campaign: "수분 크림 체험단", campaignId: "cream", region: "국내",
    amount: 150000, status: "지급 완료", paidDate: "2026-07-08",
    bankMasked: "국민 --0192 · 예금주 세림",
  },
  // ── 해외(가상, 영문 핸들 · PayPal) ───────────────────────────────
  {
    id: "st-emma", name: "Emma", handle: "@emma_kbeauty",
    campaign: "수분 크림 체험단", campaignId: "cream", region: "해외",
    amount: 220000, status: "지급 완료", paidDate: "2026-07-10",
    paypalMasked: "e•••@gmail.com",
  },
  {
    id: "st-yuki", name: "Yuki", handle: "@yuki_skincare",
    campaign: "데일리 토너 체험단", campaignId: "toner", region: "해외",
    amount: 180000, status: "정산 예정", dueDate: "2026-07-28",
    paypalMasked: "y•••@icloud.com",
  },
];

// 파생값 — 수수료·실지급액. 세전 금액과 요율에서 계산(반올림).
export const feeOf = (s: Settlement) => Math.round(s.amount * FEE_RATE);
export const netOf = (s: Settlement) => s.amount - feeOf(s);

// 상단 요약 3종. 정산 예정 총액·이번 달 지급 완료는 실지급액 기준, 수수료는 전 건 합.
export function settlementSummary() {
  const pendingNet = SETTLEMENTS.filter((s) => s.status === "정산 예정").reduce((a, s) => a + netOf(s), 0);
  const paidThisMonthNet = SETTLEMENTS
    .filter((s) => s.status === "지급 완료" && s.paidDate?.startsWith(THIS_MONTH))
    .reduce((a, s) => a + netOf(s), 0);
  const feeTotal = SETTLEMENTS.reduce((a, s) => a + feeOf(s), 0);
  return { pendingNet, paidThisMonthNet, feeTotal };
}
