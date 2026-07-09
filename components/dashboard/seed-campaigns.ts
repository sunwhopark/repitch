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

export type CampaignCreator = {
  name: string;
  handle: string; // @username
  platform: "instagram" | "youtube";
  followers: number;
  status: CreatorStatus;
  proposalId?: string; // set when 역제안 도착 → links to the inbox seed
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

export type Campaign = {
  id: string;
  product: string; // 캠페인명
  offer: string; // 제공 내역(제품·수량)
  period: string;
  status: "진행 중" | "종료";
  funnel: CampaignFunnel;
  creators: CampaignCreator[];
  posts: CampaignPost[];
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
