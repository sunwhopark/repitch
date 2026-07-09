// Demo KPI data for the dashboard home. 100% dummy — no campaign has run yet
// (pre-launch demo). Replace each block with real queries later.
import { SEED_PROPOSALS } from "@/components/dashboard/seed-proposals";

// 다크 강조 카드 — repitch 핵심 지표(이번 달 도착한 역제안). 미니 스파크라인은
// 7월 누적 역제안 건수(더미).
export const HERO_CARD = {
  label: "이번 달 역제안",
  value: "7건",
  caption: "지난달 4건 → 이번 달 7건",
  spark: [1, 1, 2, 2, 3, 4, 4, 5, 6, 7],
};

export type StatCard = {
  label: string;
  value: string;
  deltaLabel: string; // e.g. "12.4%"
  up: boolean; // arrow direction only — rendered monotone (no color)
  caption: string; // e.g. "지난달 대비"
};

export const STAT_CARDS: StatCard[] = [
  { label: "진행 중 캠페인", value: "3", deltaLabel: "1건", up: true, caption: "지난달 대비" },
  { label: "이번 달 도달", value: "128.4만", deltaLabel: "12.4%", up: true, caption: "지난달 대비" },
  { label: "평균 참여율", value: "4.2%", deltaLabel: "0.3%p", up: false, caption: "지난달 대비" },
  { label: "광고비 집행", value: "1,240만원", deltaLabel: "8.7%", up: true, caption: "지난달 대비" },
];

// 최근 30일 일별 시계열(더미) — 세 차트가 같은 기간축을 공유한다.
//   reach     : 일별 도달
//   proposals : 역제안 유입(하루 0~2건 수준)
//   ig / yt   : 브랜드 태그 콘텐츠 게시량(플랫폼별)
export type DailyPoint = {
  date: string;
  reach: number;
  proposals: number;
  ig: number;
  yt: number;
};

export const DAILY: DailyPoint[] = [
  { date: "6/11", reach: 118000, proposals: 0, ig: 2, yt: 1 },
  { date: "6/12", reach: 132000, proposals: 0, ig: 1, yt: 0 },
  { date: "6/13", reach: 126000, proposals: 0, ig: 3, yt: 1 },
  { date: "6/14", reach: 141000, proposals: 1, ig: 2, yt: 2 },
  { date: "6/15", reach: 155000, proposals: 0, ig: 4, yt: 1 },
  { date: "6/16", reach: 138000, proposals: 0, ig: 1, yt: 0 },
  { date: "6/17", reach: 149000, proposals: 0, ig: 2, yt: 2 },
  { date: "6/18", reach: 162000, proposals: 0, ig: 3, yt: 1 },
  { date: "6/19", reach: 171000, proposals: 0, ig: 5, yt: 2 },
  { date: "6/20", reach: 158000, proposals: 1, ig: 2, yt: 1 },
  { date: "6/21", reach: 167000, proposals: 0, ig: 4, yt: 1 },
  { date: "6/22", reach: 184000, proposals: 0, ig: 3, yt: 2 },
  { date: "6/23", reach: 176000, proposals: 0, ig: 2, yt: 3 },
  { date: "6/24", reach: 191000, proposals: 0, ig: 5, yt: 2 },
  { date: "6/25", reach: 205000, proposals: 0, ig: 4, yt: 1 },
  { date: "6/26", reach: 198000, proposals: 1, ig: 3, yt: 3 },
  { date: "6/27", reach: 212000, proposals: 0, ig: 6, yt: 2 },
  { date: "6/28", reach: 224000, proposals: 0, ig: 4, yt: 4 },
  { date: "6/29", reach: 216000, proposals: 0, ig: 3, yt: 3 },
  { date: "6/30", reach: 231000, proposals: 0, ig: 5, yt: 2 },
  { date: "7/1", reach: 245000, proposals: 1, ig: 4, yt: 4 },
  { date: "7/2", reach: 238000, proposals: 0, ig: 6, yt: 3 },
  { date: "7/3", reach: 252000, proposals: 1, ig: 5, yt: 5 },
  { date: "7/4", reach: 268000, proposals: 0, ig: 7, yt: 4 },
  { date: "7/5", reach: 259000, proposals: 1, ig: 6, yt: 3 },
  { date: "7/6", reach: 274000, proposals: 1, ig: 5, yt: 5 },
  { date: "7/7", reach: 288000, proposals: 0, ig: 8, yt: 4 },
  { date: "7/8", reach: 279000, proposals: 1, ig: 6, yt: 6 },
  { date: "7/9", reach: 296000, proposals: 1, ig: 7, yt: 5 },
  { date: "7/10", reach: 311000, proposals: 1, ig: 9, yt: 4 },
];

// 인플루언서 랭킹 Top 5 — 인박스 시드 프로필 재사용 + 더미 도달/참여율.
const RANK_ORDER = ["p1", "p3", "p6", "p2", "p5"] as const;
const REACH_BY_ID: Record<string, number> = {
  p1: 128000, p3: 96000, p6: 74000, p2: 41000, p5: 33000,
};
const ENGAGEMENT_BY_ID: Record<string, number> = {
  p1: 5.8, p3: 4.9, p6: 3.7, p2: 3.1, p5: 4.4,
};

export type RankRow = {
  rank: number;
  profile_name: string;
  platform: "instagram" | "youtube";
  followers: number;
  reach: number;
  engagement: number;
};

export const INFLUENCER_RANKING: RankRow[] = RANK_ORDER.map((id, i) => {
  const p = SEED_PROPOSALS.find((x) => x.id === id)!;
  return {
    rank: i + 1,
    profile_name: p.profile_name,
    platform: p.platform,
    followers: p.profile_count,
    reach: REACH_BY_ID[id],
    engagement: ENGAGEMENT_BY_ID[id],
  };
});

// 최근 활동 — 인박스 시드와 연결된 더미 피드.
export type Activity = { profile: string; text: string; time: string };
export const RECENT_ACTIVITY: Activity[] = [
  { profile: "seoyeon.skin", text: "님의 역제안이 도착했어요", time: "2시간 전" },
  { profile: "hungry_jun", text: "님 제안을 검토 중이에요", time: "1일 전" },
  { profile: "daily_hana", text: "님에게 협의를 요청했어요", time: "2일 전" },
  { profile: "savvy_luna", text: "님의 제안을 거절했어요", time: "3일 전" },
  { profile: "gadget_seo", text: "님과의 캠페인이 시작됐어요", time: "5일 전" },
  { profile: "min_v.official", text: "님의 역제안이 도착했어요", time: "6일 전" },
];
