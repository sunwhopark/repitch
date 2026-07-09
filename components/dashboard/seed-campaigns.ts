// Demo seed for the 캠페인 pages. 100% dummy (pre-launch) — no real seeding
// campaign has run. Replace with real queries later.
//
// 세계관 연결: 진행 중 3 + 종료 1 = 4개(홈 "진행 중 캠페인 3"과 일치). 인박스
// 시드 7명을 캠페인들에 분배한다 — 필터를 통과하는 뷰티/라이프 3명(p1·p2·p5)은
// "역제안 도착" 상태로 인박스에 딥링크되고, 나머지 4명은 오프카테고리 지원자라
// "미선정"으로 배치된다(인박스 하드필터 제외 서사와 동일).

export type CreatorStatus =
  | "선정됨"
  | "발송됨"
  | "체험 중"
  | "역제안 도착"
  | "미선정";

// 배송지 — 전부 더미. 실서비스: 크리에이터 온보딩 때 수집하고, 선정된 건에
// 한해 브랜드에게 노출한다(개인정보 최소 노출).
export type ShippingAddress = {
  recipient: string;
  phone: string; // 뒷자리 마스킹
  address: string;
};

export type CampaignCreator = {
  name: string;
  handle: string; // @username
  platform: "instagram" | "youtube";
  followers: number;
  status: CreatorStatus;
  proposalId?: string; // set when 역제안 도착 → links to the inbox seed
  shipping?: ShippingAddress; // 선정 이후 노출
  tracking?: { carrier: string; number: string }; // 발송 등록 시
  trialStartDate?: string; // 체험 중 전환 시 (C1 지표의 체험 시작점)
};

// 신청자 — 검토·선정 대상. 매칭 점수는 점수 엔진의 Fit 개념을 딴 경량 사전
// 계산값(실서비스: proposal 데이터가 모이면 lib/scoring 전체 엔진으로 산출).
export type Applicant = {
  id: string;
  name: string;
  handle: string;
  platform: "instagram" | "youtube";
  followers: number;
  category: string;
  engagement: number;
  matchScore: number;
  status: "검토 대기" | "선정" | "보류";
};

export type CampaignPost = {
  handle: string;
  platform: "instagram" | "youtube";
  date: string;
  views: number;
  likes: number;
  comments: number;
};

export type CampaignFunnel = {
  applied: number; // 체험 신청
  selected: number; // 선정
  shipped: number; // 제품 발송
  trialing: number; // 체험 중
  proposals: number; // 역제안 도착
};

// Wizard inputs, stored on user-created campaigns so 수정 can prefill them.
export type CampaignForm = {
  product: string;
  category: string;
  intro: string;
  ages: string[];
  gender: string;
  headcount: string;
  platforms: ("instagram" | "youtube")[];
  provision: string;
  quantity: string;
  trial: string;
  start: string; // ISO YYYY-MM-DD
  end: string;
};

export type Campaign = {
  id: string;
  product: string; // 캠페인명
  offer: string; // 제공 내역(제품·수량)
  period: string;
  status: "진행 중" | "종료";
  funnel: CampaignFunnel;
  creators: CampaignCreator[];
  applicants?: Applicant[]; // 진행 중 캠페인에 부여(아래 post-process)
  posts: CampaignPost[];
  // Set only on wizard-created campaigns. Seeds omit it → not editable/deletable
  // (home stat + inbox deep links depend on the seeds staying fixed).
  custom?: boolean;
  form?: CampaignForm;
};

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: "toner",
    product: "데일리 토너 체험단",
    offer: "데일리 토너 200ml · 1개",
    period: "6/23 – 7/13",
    status: "진행 중",
    funnel: { applied: 72, selected: 12, shipped: 12, trialing: 9, proposals: 3 },
    creators: [
      { name: "서연", handle: "@seoyeon.skin", platform: "instagram", followers: 32000, status: "역제안 도착", proposalId: "p1" },
      { name: "지우", handle: "@jiwoo.daily", platform: "instagram", followers: 14500, status: "체험 중" },
      { name: "하늘", handle: "@haneul.glow", platform: "instagram", followers: 9800, status: "발송됨" },
      { name: "은채", handle: "@eunchae.skin", platform: "instagram", followers: 21000, status: "선정됨" },
      { name: "준", handle: "@hungry_jun", platform: "youtube", followers: 88000, status: "미선정", proposalId: "p3" },
    ],
    posts: [],
  },
  {
    id: "lipbalm",
    product: "립 밤 신제품",
    offer: "립 밤 4.5g · 2개",
    period: "6/28 – 7/18",
    status: "진행 중",
    funnel: { applied: 54, selected: 10, shipped: 8, trialing: 6, proposals: 2 },
    creators: [
      { name: "민비", handle: "@min_v.official", platform: "instagram", followers: 12000, status: "역제안 도착", proposalId: "p2" },
      { name: "소라", handle: "@sora.liplog", platform: "instagram", followers: 18700, status: "체험 중" },
      { name: "다인", handle: "@dain.beauty", platform: "instagram", followers: 7600, status: "발송됨" },
      { name: "철민", handle: "@ironbody_kim", platform: "instagram", followers: 21000, status: "미선정", proposalId: "p4" },
    ],
    posts: [],
  },
  {
    id: "cleanser",
    product: "클렌징 폼 체험단",
    offer: "클렌징 폼 150ml · 1개",
    period: "7/1 – 7/21",
    status: "진행 중",
    funnel: { applied: 88, selected: 15, shipped: 14, trialing: 11, proposals: 2 },
    creators: [
      { name: "하나", handle: "@daily_hana", platform: "instagram", followers: 8500, status: "역제안 도착", proposalId: "p5" },
      { name: "유진", handle: "@yujin.care", platform: "instagram", followers: 26400, status: "체험 중" },
      { name: "보라", handle: "@bora.routine", platform: "instagram", followers: 11200, status: "선정됨" },
      { name: "서우", handle: "@gadget_seo", platform: "youtube", followers: 54000, status: "미선정", proposalId: "p6" },
    ],
    posts: [],
  },
  {
    id: "cream",
    product: "수분 크림 체험단",
    offer: "수분 크림 50ml · 1개",
    period: "5/26 – 6/15",
    status: "종료",
    funnel: { applied: 63, selected: 11, shipped: 11, trialing: 8, proposals: 2 },
    creators: [
      { name: "미나", handle: "@mina.gloss", platform: "instagram", followers: 19500, status: "역제안 도착" },
      { name: "루비", handle: "@ruby.care", platform: "instagram", followers: 13300, status: "역제안 도착" },
      { name: "세림", handle: "@serim.skin", platform: "instagram", followers: 9100, status: "발송됨" },
      { name: "루나", handle: "@savvy_luna", platform: "youtube", followers: 9000, status: "미선정", proposalId: "p7" },
    ],
    posts: [
      { handle: "@mina.gloss", platform: "instagram", date: "6/2", views: 1240, likes: 86, comments: 12 },
      { handle: "@ruby.care", platform: "instagram", date: "6/5", views: 980, likes: 64, comments: 9 },
    ],
  },
];

export const getCampaign = (id: string) => SEED_CAMPAIGNS.find((c) => c.id === id);

// ── 운영(선정·발송) 더미 데이터 ─────────────────────────────────────────
import { SEED_INFLUENCERS } from "@/components/dashboard/seed-influencers";

// 택배사 조회 URL 패턴(구조만 — 더미 송장이라 실제 조회는 안 됨). 실서비스:
// 배송추적 API(스마트택배 등)로 상태를 폴링해 자동 전환한다.
export const CARRIERS: { name: string; url: (n: string) => string }[] = [
  { name: "CJ대한통운", url: (n) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${n}` },
  { name: "우체국", url: (n) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}` },
  { name: "한진택배", url: (n) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=${n}` },
  { name: "롯데택배", url: (n) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${n}` },
];

const ADDR_POOL = [
  "서울특별시 마포구 양화로 ○○ (더미)",
  "서울특별시 성동구 왕십리로 ○○ (더미)",
  "경기도 성남시 분당구 판교로 ○○ (더미)",
  "부산광역시 해운대구 센텀중앙로 ○○ (더미)",
];
const hash = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
// 배송지 더미(선정 시 부여). 전화 뒷자리만 노출, 앞은 마스킹.
export function dummyShipping(recipient: string): ShippingAddress {
  const h = hash(recipient);
  return {
    recipient,
    phone: `010-****-${String(1000 + (h % 9000))}`,
    address: ADDR_POOL[h % ADDR_POOL.length],
  };
}
export function dummyInvoice(seed: string): string {
  return String(6010_0000_0000 + (hash(seed) % 90_000_000));
}

// 경량 매칭 점수(Fit 개념) — 카테고리 일치 + 참여율 + 규모.
function matchScore(inf: (typeof SEED_INFLUENCERS)[number], productCategory: string): number {
  let s = 45;
  if (inf.category === productCategory) s += 28;
  else if (inf.category === "라이프스타일" || inf.category === "패션") s += 12;
  s += Math.min(16, inf.engagement * 3.2);
  s += Math.min(11, inf.followers / 12000);
  return Math.max(0, Math.min(100, Math.round(s)));
}
function buildApplicants(ids: string[], cat: string): Applicant[] {
  return ids
    .map((id) => SEED_INFLUENCERS.find((i) => i.id === id))
    .filter((i): i is (typeof SEED_INFLUENCERS)[number] => !!i)
    .map((inf) => ({
      id: inf.id,
      name: inf.profile_name,
      handle: `@${inf.profile_name}`,
      platform: inf.platform,
      followers: inf.followers,
      category: inf.category,
      engagement: inf.engagement,
      matchScore: matchScore(inf, cat),
      status: "검토 대기" as const,
    }));
}
// 선정된 신청자 → 크리에이터(선정됨 + 배송지 부여).
export function applicantToCreator(a: Applicant): CampaignCreator {
  return {
    name: a.name,
    handle: a.handle,
    platform: a.platform,
    followers: a.followers,
    status: "선정됨",
    shipping: dummyShipping(a.name),
  };
}

// 진행 중 캠페인별 신청자(인플루언서 DB에서 재사용, 각 캠페인 크리에이터와 중복 없이).
const APPLICANT_IDS: Record<string, string[]> = {
  toner: ["sora.liplog", "daily_bom", "yujin.care", "min_v.official", "foodie_noel", "gym_rio", "style_jenny", "vlog_seora", "appreview_su"],
  lipbalm: ["eunchae.skin", "jiwoo.daily", "daily_bom", "style_jenny", "foodie_noel", "tech_maru", "gym_rio", "travel_doy", "appreview_su", "haneul.glow"],
  cleanser: ["haneul.glow", "sora.liplog", "daily_bom", "vlog_seora", "gym_rio", "foodie_noel", "style_jenny", "tech_maru", "appreview_su"],
};

// Attach dummy shipping/tracking/trial to seed creators + build applicants.
for (const c of SEED_CAMPAIGNS) {
  for (const cr of c.creators) {
    if (cr.status !== "미선정") cr.shipping = dummyShipping(cr.name);
    if (cr.status === "발송됨") cr.tracking = { carrier: "CJ대한통운", number: dummyInvoice(cr.handle) };
    if (cr.status === "체험 중") {
      cr.tracking = { carrier: "우체국", number: dummyInvoice(cr.handle) };
      cr.trialStartDate = "6/28";
    }
  }
  c.applicants = buildApplicants(APPLICANT_IDS[c.id] ?? [], "뷰티"); // 시드 제품은 전부 뷰티
}
