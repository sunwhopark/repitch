// Demo seed for the 인플루언서 DB. 100% dummy. The 7 inbox-seed people are
// included with the SAME numbers (same 세계관), each carrying proposalId so the
// DB panel can jump to their 역제안. The other 13 are new — including the
// campaign filler creators (jiwoo.daily, haneul.glow, eunchae.skin, …) so the
// campaign pages stay consistent. Replace with real queries later.

export type Influencer = {
  id: string;
  profile_name: string;
  profile_url: string; // 데모: 플랫폼 홈 (가상 인물이라 실제 핸들로 걸지 않음)
  platform: "instagram" | "youtube";
  category: string;
  followers: number;
  avg_views: number;
  engagement: number; // %
  creator_type: "실물" | "버추얼";
  gender: "여성" | "남성";
  region: string; // 활동 지역
  collabs: number; // 과거 협업 수
  bio: string; // 한 줄 소개
  proposalId?: string; // 인박스에 제안이 있는 인물(7명)
};

const IG = "https://www.instagram.com";
const YT = "https://www.youtube.com";

export const SEED_INFLUENCERS: Influencer[] = [
  // ── 인박스 시드 7명 (같은 인물·같은 수치) ───────────────────────────
  { id: "seoyeon.skin", profile_name: "seoyeon.skin", profile_url: IG, platform: "instagram", category: "뷰티", followers: 32000, avg_views: 42000, engagement: 5.8, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 5, bio: "3년째 쓰는 토너 실사용 루틴을 기록해요.", proposalId: "p1" },
  { id: "min_v.official", profile_name: "min_v.official", profile_url: IG, platform: "instagram", category: "뷰티", followers: 12000, avg_views: 8000, engagement: 3.1, creator_type: "버추얼", gender: "여성", region: "대한민국", collabs: 2, bio: "데일리 메이크업과 신상 코스메틱 소개.", proposalId: "p2" },
  { id: "hungry_jun", profile_name: "hungry_jun", profile_url: YT, platform: "youtube", category: "식품", followers: 88000, avg_views: 150000, engagement: 4.9, creator_type: "실물", gender: "남성", region: "대한민국", collabs: 8, bio: "집밥·간편식 6개월 장기 먹방 리뷰.", proposalId: "p3" },
  { id: "ironbody_kim", profile_name: "ironbody_kim", profile_url: IG, platform: "instagram", category: "헬스·피트니스", followers: 21000, avg_views: 30000, engagement: 3.7, creator_type: "실물", gender: "남성", region: "대한민국", collabs: 12, bio: "홈트·프로틴 루틴을 숏폼으로.", proposalId: "p4" },
  { id: "daily_hana", profile_name: "daily_hana", profile_url: IG, platform: "instagram", category: "라이프스타일", followers: 8500, avg_views: 15000, engagement: 4.4, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 0, bio: "소소한 살림·자취템 일상 기록.", proposalId: "p5" },
  { id: "gadget_seo", profile_name: "gadget_seo", profile_url: YT, platform: "youtube", category: "전자기기", followers: 54000, avg_views: 68000, engagement: 3.7, creator_type: "실물", gender: "남성", region: "대한민국", collabs: 5, bio: "가젯 스펙 비교 리뷰 채널.", proposalId: "p6" },
  { id: "savvy_luna", profile_name: "savvy_luna", profile_url: YT, platform: "youtube", category: "앱·서비스", followers: 9000, avg_views: 30000, engagement: 4.0, creator_type: "버추얼", gender: "여성", region: "미국", collabs: 2, bio: "가계부·저축 앱 활용 브이로그.", proposalId: "p7" },

  // ── 신규 13명 (캠페인에 등장한 크리에이터 포함) ─────────────────────
  { id: "jiwoo.daily", profile_name: "jiwoo.daily", profile_url: IG, platform: "instagram", category: "뷰티", followers: 14500, avg_views: 19000, engagement: 4.6, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 3, bio: "데일리 스킨케어 전후 비교 콘텐츠." },
  { id: "haneul.glow", profile_name: "haneul.glow", profile_url: IG, platform: "instagram", category: "뷰티", followers: 9800, avg_views: 12000, engagement: 5.1, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 1, bio: "글로우 메이크업 튜토리얼." },
  { id: "eunchae.skin", profile_name: "eunchae.skin", profile_url: IG, platform: "instagram", category: "뷰티", followers: 21000, avg_views: 25000, engagement: 4.2, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 4, bio: "민감성 피부 성분 리뷰." },
  { id: "sora.liplog", profile_name: "sora.liplog", profile_url: IG, platform: "instagram", category: "뷰티", followers: 18700, avg_views: 22000, engagement: 4.8, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 6, bio: "립 제품 스와치·발색 기록." },
  { id: "yujin.care", profile_name: "yujin.care", profile_url: IG, platform: "instagram", category: "라이프스타일", followers: 26400, avg_views: 31000, engagement: 3.9, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 7, bio: "미니멀 살림·홈케어 루틴." },
  { id: "foodie_noel", profile_name: "foodie_noel", profile_url: YT, platform: "youtube", category: "식품", followers: 62000, avg_views: 88000, engagement: 4.3, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 9, bio: "디저트·베이킹 레시피 롱폼." },
  { id: "gym_rio", profile_name: "gym_rio", profile_url: IG, platform: "instagram", category: "헬스·피트니스", followers: 43000, avg_views: 51000, engagement: 4.1, creator_type: "실물", gender: "남성", region: "대한민국", collabs: 10, bio: "3대 운동 폼 교정 숏폼." },
  { id: "tech_maru", profile_name: "tech_maru", profile_url: YT, platform: "youtube", category: "전자기기", followers: 91000, avg_views: 120000, engagement: 3.5, creator_type: "실물", gender: "남성", region: "대한민국", collabs: 14, bio: "신제품 언박싱·벤치마크." },
  { id: "appreview_su", profile_name: "appreview_su", profile_url: YT, platform: "youtube", category: "앱·서비스", followers: 15000, avg_views: 34000, engagement: 4.0, creator_type: "실물", gender: "남성", region: "미국", collabs: 3, bio: "생산성 앱 워크플로 소개." },
  { id: "style_jenny", profile_name: "style_jenny", profile_url: IG, platform: "instagram", category: "패션", followers: 128000, avg_views: 96000, engagement: 3.3, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 18, bio: "데일리룩·시즌 트렌드 코디." },
  { id: "travel_doy", profile_name: "travel_doy", profile_url: YT, platform: "youtube", category: "여행", followers: 74000, avg_views: 110000, engagement: 4.5, creator_type: "실물", gender: "남성", region: "대한민국", collabs: 11, bio: "국내외 여행 브이로그." },
  { id: "daily_bom", profile_name: "daily_bom", profile_url: IG, platform: "instagram", category: "라이프스타일", followers: 6300, avg_views: 9000, engagement: 5.4, creator_type: "실물", gender: "여성", region: "대한민국", collabs: 1, bio: "자취 인테리어·소품 추천." },
  { id: "vlog_seora", profile_name: "vlog_seora", profile_url: IG, platform: "instagram", category: "여행", followers: 33000, avg_views: 28000, engagement: 3.8, creator_type: "버추얼", gender: "여성", region: "일본", collabs: 4, bio: "도쿄 근교 감성 여행 기록." },
];
