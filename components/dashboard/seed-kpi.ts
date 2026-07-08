// Demo KPI data for the dashboard home. 100% dummy — no campaign has run yet
// (pre-launch demo). Replace each block with real queries later.
import { SEED_PROPOSALS } from "@/components/dashboard/seed-proposals";

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
  { label: "총 광고비 집행", value: "1,240만원", deltaLabel: "8.7%", up: true, caption: "지난달 대비" },
];

// 도달 추이 — 최근 7일 일별 도달(더미).
export const REACH_TREND = [
  { day: "월", reach: 182000 },
  { day: "화", reach: 168000 },
  { day: "수", reach: 205000 },
  { day: "목", reach: 231000 },
  { day: "금", reach: 258000 },
  { day: "토", reach: 224000 },
  { day: "일", reach: 289000 },
];

// 플랫폼별 성과 — 일별 매칭 성사 건수(더미), IG/YT 두 계열.
export const PLATFORM_PERF = [
  { date: "4/7", instagram: 12, youtube: 6 },
  { date: "4/8", instagram: 14, youtube: 7 },
  { date: "4/9", instagram: 13, youtube: 7 },
  { date: "4/10", instagram: 18, youtube: 9 },
  { date: "4/11", instagram: 20, youtube: 10 },
  { date: "4/12", instagram: 17, youtube: 11 },
  { date: "4/13", instagram: 21, youtube: 12 },
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
