// Demo seed for the 제품 KPI pages. 100% dummy. Products mirror the campaign
// seeds (데일리 토너·립 밤·클렌징 폼·수분 크림) for a consistent 세계관.
//
// The 90-day daily series is generated DETERMINISTICALLY (pure math, no
// Date.now/Math.random) so server and client render identically. Event markers
// mark 캠페인 시작 / 역제안 콘텐츠 게시 — the series is tuned so 순위·리뷰 rise
// after each content marker (the influencer-activity → commerce link).
//
// 실서비스 데이터 소스(커머스 순위·리뷰 크롤링 / 오픈 API)는 미정 — 확정 시
// 이 시드 블록을 실데이터 쿼리로 교체한다.

export type ProductPoint = {
  date: string;
  rank: number;
  reviews: number; // 신규 리뷰/일
  price: number; // 원
  ig: number;
  yt: number;
};
export type ProductEvent = { day: number; n: number; label: string; date: string };

// 브랜드 태그 콘텐츠. 게시자는 우리 인박스 시드 인물(IG/YT)뿐 아니라 외부
// 계정(틱톡 등)도 포함 — 인플루언서 시드는 확장하지 않는다. content_url은
// 가상이라 플랫폼 홈(기존 정책).
export type ContentItem = {
  id: string;
  platform: "instagram" | "youtube" | "tiktok";
  handle: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  followers: number; // 팔로워/구독자
  engagement: number; // % 반응률
  content_url: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  channel: "쿠팡" | "네이버 스마트스토어" | "올리브영";
  rank: number; // 현재 카테고리 순위
  reviews: number; // 누적 리뷰 수
  rating: number;
  cumulativeCreators: number;
  proposals: number; // 역제안 수
  series: ProductPoint[];
  events: ProductEvent[];
  content?: ContentItem[]; // 아래 post-process에서 채움
};

// 4/12부터 90일치 "M/D" 라벨 (≈ 7/10 까지).
function makeDates(startMonth: number, startDay: number, n: number): string[] {
  const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let m = startMonth, d = startDay;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(`${m}/${d}`);
    d++;
    if (d > dim[m - 1]) { d = 1; m++; if (m > 12) m = 1; }
  }
  return out;
}
const DATES = makeDates(4, 12, 90);

// deterministic pseudo-noise in [-1, 1]
function noise(i: number, seed: number): number {
  const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
function lerpAnchors(anchors: [number, number][], i: number): number {
  for (let k = 0; k < anchors.length - 1; k++) {
    const [d0, v0] = anchors[k];
    const [d1, v1] = anchors[k + 1];
    if (i >= d0 && i <= d1) {
      const t = (i - d0) / (d1 - d0 || 1);
      return v0 + (v1 - v0) * t;
    }
  }
  return anchors[anchors.length - 1][1];
}

type Cfg = {
  rankAnchors: [number, number][];
  rankJitter: number;
  reviewBase: number;
  reviewBoosts: [number, number][];
  priceSteps: [number, number][];
  content: { day: number; ig: number; yt: number; spread: number }[];
  seed: number;
};

function buildSeries(cfg: Cfg): ProductPoint[] {
  return DATES.map((date, i) => {
    const rank = Math.max(1, Math.round(lerpAnchors(cfg.rankAnchors, i) + noise(i, cfg.seed) * cfg.rankJitter));
    let rv = cfg.reviewBase;
    for (const [d, add] of cfg.reviewBoosts) if (i >= d) rv += add;
    rv = Math.max(0, Math.round(rv + noise(i, cfg.seed + 3) * 2));
    let price = cfg.priceSteps[0][1];
    for (const [d, p] of cfg.priceSteps) if (i >= d) price = p;
    let ig = 0, yt = 0;
    for (const c of cfg.content) {
      const dist = Math.abs(i - c.day);
      if (dist <= c.spread) {
        const w = 1 - dist / (c.spread + 1);
        ig += Math.round(c.ig * w);
        yt += Math.round(c.yt * w);
      }
    }
    return { date, rank, reviews: rv, price, ig, yt };
  });
}
const ev = (day: number, n: number, label: string): ProductEvent => ({ day, n, label, date: DATES[day] });

export const SEED_PRODUCTS: Product[] = [
  {
    id: "toner",
    name: "데일리 토너",
    category: "뷰티",
    price: 24900,
    channel: "올리브영",
    rank: 22,
    reviews: 6318,
    rating: 4.4,
    cumulativeCreators: 42,
    proposals: 3,
    series: buildSeries({
      rankAnchors: [[0, 79], [35, 72], [50, 60], [58, 40], [70, 24], [89, 22]],
      rankJitter: 3,
      reviewBase: 3,
      reviewBoosts: [[55, 4], [68, 3]],
      priceSteps: [[0, 24900], [28, 22900], [50, 24900]],
      content: [{ day: 55, ig: 9, yt: 3, spread: 6 }, { day: 68, ig: 6, yt: 2, spread: 5 }],
      seed: 1,
    }),
    events: [ev(40, 1, "캠페인 시작"), ev(55, 2, "seoyeon.skin 역제안 콘텐츠 게시"), ev(68, 3, "jiwoo.daily 콘텐츠 게시")],
  },
  {
    id: "lipbalm",
    name: "립 밤",
    category: "뷰티",
    price: 12900,
    channel: "쿠팡",
    rank: 14,
    reviews: 2841,
    rating: 4.6,
    cumulativeCreators: 30,
    proposals: 2,
    series: buildSeries({
      rankAnchors: [[0, 88], [30, 70], [48, 44], [60, 22], [75, 15], [89, 14]],
      rankJitter: 3,
      reviewBase: 2,
      reviewBoosts: [[50, 3], [70, 2]],
      priceSteps: [[0, 13900], [35, 12900]],
      content: [{ day: 50, ig: 7, yt: 1, spread: 5 }, { day: 70, ig: 5, yt: 1, spread: 5 }],
      seed: 2,
    }),
    events: [ev(35, 1, "캠페인 시작"), ev(50, 2, "min_v.official 역제안 콘텐츠 게시"), ev(70, 3, "sora.liplog 콘텐츠 게시")],
  },
  {
    id: "cleanser",
    name: "클렌징 폼",
    category: "뷰티",
    price: 16900,
    channel: "네이버 스마트스토어",
    rank: 31,
    reviews: 4102,
    rating: 4.3,
    cumulativeCreators: 51,
    proposals: 2,
    series: buildSeries({
      rankAnchors: [[0, 95], [40, 80], [55, 60], [68, 40], [80, 33], [89, 31]],
      rankJitter: 4,
      reviewBase: 3,
      reviewBoosts: [[58, 3], [74, 2]],
      priceSteps: [[0, 16900], [40, 15900], [72, 16900]],
      content: [{ day: 58, ig: 8, yt: 2, spread: 6 }, { day: 74, ig: 5, yt: 2, spread: 5 }],
      seed: 3,
    }),
    events: [ev(45, 1, "캠페인 시작"), ev(58, 2, "daily_hana 역제안 콘텐츠 게시"), ev(74, 3, "yujin.care 콘텐츠 게시")],
  },
  {
    id: "cream",
    name: "수분 크림",
    category: "뷰티",
    price: 28900,
    channel: "올리브영",
    rank: 8,
    reviews: 5210,
    rating: 4.5,
    cumulativeCreators: 63,
    proposals: 2,
    series: buildSeries({
      rankAnchors: [[0, 64], [25, 50], [40, 30], [55, 14], [70, 9], [89, 8]],
      rankJitter: 3,
      reviewBase: 4,
      reviewBoosts: [[38, 4], [55, 3]],
      priceSteps: [[0, 28900], [20, 26900], [48, 28900]],
      content: [{ day: 38, ig: 8, yt: 2, spread: 6 }, { day: 55, ig: 6, yt: 2, spread: 5 }],
      seed: 4,
    }),
    events: [ev(28, 1, "캠페인 시작"), ev(38, 2, "mina.gloss 역제안 콘텐츠 게시"), ev(55, 3, "ruby.care 콘텐츠 게시")],
  },
];

export const getProduct = (id: string) => SEED_PRODUCTS.find((p) => p.id === id);

// ── 관련 콘텐츠 (우측 레일) ─────────────────────────────────────────────
// 제품별 8~12개, 플랫폼 섞음(IG 4~5 · YT 3~4 · 틱톡 2~3). 마커에 등장한 인박스
// 시드 인물(seoyeon.skin 등)은 그대로 유지해 세계관을 잇고, 나머지 IG/YT + 틱톡
// 전부는 외부 계정. 마커 콘텐츠의 게시일은 이벤트 마커 시점과 정합된다.
const CONTENT_HOME = {
  instagram: "https://www.instagram.com",
  youtube: "https://www.youtube.com",
  tiktok: "https://www.tiktok.com",
} as const;

type ContentSpec = { platform: ContentItem["platform"]; handle: string; followers: number; date: string };
const CONTENT_SPECS: Record<string, ContentSpec[]> = {
  toner: [
    { platform: "instagram", handle: "@seoyeon.skin", followers: 32000, date: "" }, // 마커 ②
    { platform: "instagram", handle: "@jiwoo.daily", followers: 14500, date: "" }, // 마커 ③
    { platform: "instagram", handle: "@glowdiary_mi", followers: 26000, date: "6/12" },
    { platform: "instagram", handle: "@skin.log", followers: 11000, date: "6/24" },
    { platform: "youtube", handle: "@derm.talk", followers: 120000, date: "6/9" },
    { platform: "youtube", handle: "@honest.skin", followers: 47000, date: "6/18" },
    { platform: "youtube", handle: "@beauty.breakdown", followers: 88000, date: "6/28" },
    { platform: "tiktok", handle: "@retinol.rae", followers: 210000, date: "6/7" },
    { platform: "tiktok", handle: "@skintok.jules", followers: 96000, date: "6/16" },
    { platform: "tiktok", handle: "@glowup.daily", followers: 340000, date: "6/26" },
  ],
  lipbalm: [
    { platform: "instagram", handle: "@min_v.official", followers: 12000, date: "" },
    { platform: "instagram", handle: "@sora.liplog", followers: 18700, date: "" },
    { platform: "instagram", handle: "@lipfocus.na", followers: 9000, date: "6/14" },
    { platform: "instagram", handle: "@daily.tint", followers: 15000, date: "6/23" },
    { platform: "youtube", handle: "@makeup.talk", followers: 64000, date: "6/11" },
    { platform: "youtube", handle: "@swatch.lab", followers: 39000, date: "6/25" },
    { platform: "youtube", handle: "@honest.beauty", followers: 72000, date: "7/1" },
    { platform: "tiktok", handle: "@liptok.mia", followers: 180000, date: "6/9" },
    { platform: "tiktok", handle: "@tint.tok", followers: 88000, date: "6/19" },
  ],
  cleanser: [
    { platform: "instagram", handle: "@daily_hana", followers: 8500, date: "" },
    { platform: "instagram", handle: "@yujin.care", followers: 26400, date: "" },
    { platform: "instagram", handle: "@clean.routine", followers: 12000, date: "6/20" },
    { platform: "instagram", handle: "@poreless.kr", followers: 19000, date: "7/2" },
    { platform: "instagram", handle: "@foam.review", followers: 7000, date: "7/6" },
    { platform: "youtube", handle: "@skinbarrier.tv", followers: 91000, date: "6/17" },
    { platform: "youtube", handle: "@routine.talk", followers: 43000, date: "6/30" },
    { platform: "tiktok", handle: "@cleantok.sy", followers: 260000, date: "6/22" },
    { platform: "tiktok", handle: "@foam.tok", followers: 74000, date: "7/4" },
    { platform: "tiktok", handle: "@skincycle", followers: 150000, date: "7/8" },
  ],
  cream: [
    { platform: "instagram", handle: "@mina.gloss", followers: 19500, date: "" },
    { platform: "instagram", handle: "@ruby.care", followers: 13300, date: "" },
    { platform: "instagram", handle: "@moist.daily", followers: 22000, date: "5/28" },
    { platform: "instagram", handle: "@glassskin.kr", followers: 31000, date: "6/8" },
    { platform: "youtube", handle: "@winter.skin", followers: 68000, date: "5/24" },
    { platform: "youtube", handle: "@cream.lab", followers: 52000, date: "6/2" },
    { platform: "youtube", handle: "@barrier.talk", followers: 110000, date: "6/12" },
    { platform: "tiktok", handle: "@creamtok.lu", followers: 190000, date: "5/30" },
    { platform: "tiktok", handle: "@hydra.tok", followers: 82000, date: "6/6" },
  ],
};

// 팔로워/구독자 기반 결정론적 성과 수치(플랫폼별 도달·반응률 상이).
function deriveMetrics(platform: ContentItem["platform"], followers: number, i: number) {
  const mult = platform === "tiktok" ? 2.4 + (i % 4) * 0.9 : platform === "youtube" ? 0.7 + (i % 3) * 0.35 : 0.35 + (i % 3) * 0.18;
  const views = Math.round(followers * mult);
  const likeRate = (platform === "tiktok" ? 0.11 : platform === "youtube" ? 0.04 : 0.07) + (i % 3) * 0.01;
  const likes = Math.round(views * likeRate);
  const comments = Math.round(likes * (0.08 + (i % 4) * 0.02));
  const engagement = Math.round(((likes + comments) / views) * 1000) / 10;
  return { views, likes, comments, engagement };
}

for (const p of SEED_PRODUCTS) {
  const specs = CONTENT_SPECS[p.id] ?? [];
  p.content = specs.map((s, i) => {
    // 마커에 등장한 시드 인물이면 해당 이벤트 게시일과 정합.
    const marker = p.events.find((e) => e.n >= 2 && e.label.split(" ")[0] === s.handle.slice(1));
    return {
      id: `${p.id}-c${i}`,
      platform: s.platform,
      handle: s.handle,
      date: marker?.date ?? s.date,
      followers: s.followers,
      content_url: CONTENT_HOME[s.platform],
      ...deriveMetrics(s.platform, s.followers, i),
    };
  });
}
