// Demo seed for the 역제안 인박스. The real proposal_submissions table is
// RLS-read-blocked and holds PII, so the public demo dashboard MUST NOT read it.
// These 7 records mirror the real field shape (minus email) plus a few extra
// fields the v1.1 eval spec needs for demonstration (creator_type/gender,
// audience_country, audience_stats, recent_views_30d, trial_received_at) and
// pre-computed C-axis / B4 values that an LLM + curator would fill in production.

export type ContentPlan = { label: string; count: number };

export type AudienceStats = {
  age: Record<string, number>; // 10대/20대/30대/40대/50대+ ratios (sum ≈ 1)
  gender: { 여성: number; 남성: number };
};

export type SeedProposal = {
  id: string;
  status: "신규" | "검토중" | "응답함";

  // — mirrors public.proposal_submissions (no email) —
  brand_name: string;
  product_name: string;
  platform: "instagram" | "youtube";
  profile_name: string;
  // 플랫폼 프로필 외부 링크. 데모 인물은 가상이라 실제 핸들 URL로 걸면 남의
  // 계정이 열리므로 플랫폼 홈 수준으로만 둔다. 실서비스에선 인플루언서 실제
  // 프로필 URL이 들어간다.
  profile_url: string;
  profile_count: number;
  selected_categories: string[];
  avg_likes?: string; // range label (IG)
  avg_saves?: string;
  avg_shares?: string;
  avg_views?: string; // range label (display)
  peak_views: number; // numeric view metric used for scoring/§5
  collab_count: string;
  story_text: string;
  content_types: ContentPlan[];
  content_type_other?: string | null;
  content_tone: string;
  expected_price: number; // 만원
  reuse_allowed: boolean;
  upload_date: string;
  created_at: string; // ISO

  // — extra (demo / eval) —
  creator_type: "실물" | "버추얼";
  creator_gender: "여성" | "남성";
  audience_country: string[];
  audience_stats?: AudienceStats; // present on 4/7 → A2 미수집 시연
  recent_views_30d?: number; // present on 5/7 → B5 미수집 시연
  trial_received_at: string; // ISO → C1 체험기간

  // Pre-evaluated (LLM in production). score is on the indicator's max.
  b4: { rating: number; comment: string }; // 큐레이터 1~5
  c2: { level: number; score: number; evidence: string[] }; // 서사 구체성 /30
  c3: { level: number; score: number; evidence: string[]; ad_speak_flags: string[] }; // 진정성 /25
  c4: { level: number; score: number; evidence: string[] }; // 정체성 일치 /15
};

// 브랜드 설정값(데모): A1 카테고리 비교 · A2 오디언스 타겟에 사용.
export const DEMO_BRAND = {
  name: "데모 브랜드",
  category: "뷰티",
  targetAges: ["20대", "30대"],
  targetGender: "여성" as "여성" | "남성",
};

export const SEED_PROPOSALS: SeedProposal[] = [
  {
    id: "p1",
    status: "신규",
    brand_name: "데모 브랜드",
    product_name: "데일리 토너",
    platform: "instagram",
    profile_name: "seoyeon.skin",
    profile_url: "https://www.instagram.com",
    profile_count: 32000,
    selected_categories: ["뷰티"],
    avg_likes: "1만-10만",
    avg_saves: "1천-1만",
    avg_shares: "1천-1만",
    avg_views: "1만-10만",
    peak_views: 95000,
    collab_count: "4-6회",
    story_text:
      "3년째 이 토너를 쓰고 있어요. 아침 세안 후 화장솜에 덜어 닦아내면 각질 정리가 확실히 돼서 다음 스텝 흡수가 달라지는 걸 매일 느낍니다. 지성 피부라 끈적임 없는 마무리가 특히 좋았고, 여름엔 냉장 보관해서 진정용으로도 써요.",
    content_types: [
      { label: "숏폼", count: 2 },
      { label: "게시물", count: 1 },
    ],
    content_tone: "정보",
    expected_price: 30,
    reuse_allowed: true,
    upload_date: "2026.07.20 (월)",
    created_at: "2026-07-02T09:00:00Z",
    creator_type: "실물",
    creator_gender: "여성",
    audience_country: ["대한민국"],
    audience_stats: {
      age: { "10대": 0.1, "20대": 0.45, "30대": 0.3, "40대": 0.1, "50대+": 0.05 },
      gender: { 여성: 0.82, 남성: 0.18 },
    },
    recent_views_30d: 115000,
    trial_received_at: "2026-05-01T00:00:00Z",
    b4: { rating: 5, comment: "톤 일관성 높고 실사용 컷이 다수. 광고 티가 적음." },
    c2: {
      level: 5,
      score: 27,
      evidence: ["3년째 이 토너를 쓰고 있어요", "아침 세안 후 화장솜에 덜어 닦아내면"],
    },
    c3: { level: 5, score: 22, evidence: ["여름엔 냉장 보관해서 진정용으로도 써요"], ad_speak_flags: [] },
    c4: { level: 5, score: 13, evidence: ["지성 피부라 끈적임 없는 마무리"] },
  },
  {
    id: "p2",
    status: "신규",
    brand_name: "데모 브랜드",
    product_name: "립 세럼",
    platform: "instagram",
    profile_name: "min_v.official",
    profile_url: "https://www.instagram.com",
    profile_count: 12000,
    selected_categories: ["뷰티"],
    avg_likes: "1천-1만",
    avg_saves: "1천 미만",
    avg_shares: "1천 미만",
    avg_views: "1천-1만",
    peak_views: 9000,
    collab_count: "1-3회",
    story_text:
      "평소 관심 있던 브랜드라 협업 제안 드립니다. 제품이 좋아서 팔로워분들께도 소개하고 싶어요. 잘 부탁드립니다.",
    content_types: [{ label: "게시물", count: 2 }],
    content_tone: "일상",
    expected_price: 45,
    reuse_allowed: false,
    upload_date: "2026.07.22 (수)",
    created_at: "2026-07-02T09:00:00Z",
    creator_type: "버추얼",
    creator_gender: "여성",
    audience_country: ["대한민국", "일본"],
    recent_views_30d: 8000,
    trial_received_at: "2026-06-02T00:00:00Z",
    b4: { rating: 3, comment: "무난하나 특색이 약하고 제품 언급이 표면적." },
    c2: { level: 3, score: 18, evidence: ["평소 관심 있던 브랜드"] },
    c3: { level: 3, score: 15, evidence: [], ad_speak_flags: [] },
    c4: { level: 3, score: 9, evidence: [] },
  },
  {
    id: "p3",
    status: "검토중",
    brand_name: "데모 브랜드",
    product_name: "그래놀라 팩",
    platform: "youtube",
    profile_name: "hungry_jun",
    profile_url: "https://www.youtube.com",
    profile_count: 88000,
    selected_categories: ["식품"],
    avg_views: "10만 이상",
    peak_views: 210000,
    collab_count: "7-10회",
    story_text:
      "집에서 주 4회 이상 이 그래놀라로 아침을 대신합니다. 우유보다 두유에 말아 먹을 때 단맛이 덜해서 제 입맛엔 그게 맞더라고요. 6개월 정도 먹으면서 아침 거르는 습관이 없어진 게 제일 큰 변화예요.",
    content_types: [{ label: "롱폼", count: 1 }],
    content_tone: "정보",
    expected_price: 70,
    reuse_allowed: true,
    upload_date: "2026.07.25 (토)",
    created_at: "2026-07-03T09:00:00Z",
    creator_type: "실물",
    creator_gender: "남성",
    audience_country: ["대한민국", "미국"],
    audience_stats: {
      age: { "10대": 0.05, "20대": 0.3, "30대": 0.4, "40대": 0.2, "50대+": 0.05 },
      gender: { 여성: 0.35, 남성: 0.65 },
    },
    recent_views_30d: 180000,
    trial_received_at: "2026-05-03T00:00:00Z",
    b4: { rating: 4, comment: "설명이 성실하고 실사용 루틴이 명확. 편집 톤 안정적." },
    c2: {
      level: 5,
      score: 27,
      evidence: ["주 4회 이상 이 그래놀라로 아침을 대신", "우유보다 두유에 말아 먹을 때"],
    },
    c3: { level: 5, score: 22, evidence: ["6개월 정도 먹으면서"], ad_speak_flags: [] },
    c4: { level: 5, score: 13, evidence: [] },
  },
  {
    id: "p4",
    status: "신규",
    brand_name: "데모 브랜드",
    product_name: "프로틴 쉐이크",
    platform: "instagram",
    profile_name: "ironbody_kim",
    profile_url: "https://www.instagram.com",
    profile_count: 21000,
    selected_categories: ["헬스·피트니스"],
    avg_likes: "1만-10만",
    avg_saves: "1천-1만",
    avg_shares: "1천 미만",
    avg_views: "1만-10만",
    peak_views: 40000,
    collab_count: "10회 이상",
    story_text:
      "업계 최고 퀄리티의 제품을 합리적인 가격에 만나보세요. 저를 믿고 맡겨주시면 최선을 다해 홍보하겠습니다. 후회 없는 선택이 될 것입니다.",
    content_types: [{ label: "숏폼", count: 3 }],
    content_tone: "유머",
    expected_price: 60,
    reuse_allowed: true,
    upload_date: "2026.07.19 (일)",
    created_at: "2026-07-04T09:00:00Z",
    creator_type: "실물",
    creator_gender: "남성",
    audience_country: ["대한민국"],
    audience_stats: {
      age: { "10대": 0.05, "20대": 0.5, "30대": 0.3, "40대": 0.1, "50대+": 0.05 },
      gender: { 여성: 0.3, 남성: 0.7 },
    },
    trial_received_at: "2026-06-20T00:00:00Z",
    b4: { rating: 2, comment: "홍보 문구 위주, 제품 실사용 근거가 약함." },
    c2: { level: 2, score: 12, evidence: [] },
    c3: {
      level: 2,
      score: 8,
      evidence: [],
      ad_speak_flags: ["업계 최고 퀄리티", "합리적인 가격", "후회 없는 선택"],
    },
    c4: { level: 2, score: 6, evidence: [] },
  },
  {
    id: "p5",
    status: "신규",
    brand_name: "데모 브랜드",
    product_name: "핸드크림",
    platform: "instagram",
    profile_name: "daily_hana",
    profile_url: "https://www.instagram.com",
    profile_count: 8500,
    selected_categories: ["라이프스타일"],
    avg_likes: "1천-1만",
    avg_saves: "1천-1만",
    avg_shares: "1천-1만",
    avg_views: "1만-10만",
    peak_views: 18000,
    collab_count: "0회",
    story_text:
      "글을 잘 못 써서 죄송해요 ㅠㅠ 근데 진짜 이거 작년 겨울부터 매일 아침마다 발라요. 손목 습진 있는데 이거 바르고 자면 다음날 덜 갈라져서… 그냥 이걸 알리고 싶었어요.",
    content_types: [
      { label: "게시물", count: 1 },
      { label: "스토리", count: 2 },
    ],
    content_tone: "일상",
    expected_price: 20,
    reuse_allowed: true,
    upload_date: "2026.07.28 (화)",
    created_at: "2026-07-05T09:00:00Z",
    creator_type: "실물",
    creator_gender: "여성",
    audience_country: ["대한민국"],
    trial_received_at: "2026-06-05T00:00:00Z",
    b4: { rating: 4, comment: "문장은 서툴지만 실사용 디테일이 살아있음." },
    c2: {
      level: 4,
      score: 22,
      evidence: ["작년 겨울부터 매일 아침마다 발라요", "손목 습진 있는데 이거 바르고 자면 다음날 덜 갈라져서"],
    },
    c3: { level: 5, score: 21, evidence: ["그냥 이걸 알리고 싶었어요"], ad_speak_flags: [] },
    c4: { level: 4, score: 10, evidence: [] },
  },
  {
    id: "p6",
    status: "응답함",
    brand_name: "데모 브랜드",
    product_name: "무선 이어버드",
    platform: "youtube",
    profile_name: "gadget_seo",
    profile_url: "https://www.youtube.com",
    profile_count: 54000,
    selected_categories: ["전자기기"],
    avg_views: "1만-10만",
    peak_views: 60000,
    collab_count: "4-6회",
    story_text:
      "전자기기 리뷰를 주로 하는 채널입니다. 이 제품도 좋아 보여서 다뤄보고 싶습니다. 스펙 비교 위주로 다룰 예정이에요.",
    content_types: [{ label: "롱폼", count: 1 }],
    content_tone: "정보",
    expected_price: 55,
    reuse_allowed: false,
    upload_date: "2026.07.30 (목)",
    created_at: "2026-07-06T09:00:00Z",
    creator_type: "실물",
    creator_gender: "남성",
    audience_country: ["대한민국", "미국", "일본"],
    audience_stats: {
      age: { "10대": 0.03, "20대": 0.35, "30대": 0.37, "40대": 0.2, "50대+": 0.05 },
      gender: { 여성: 0.4, 남성: 0.6 },
    },
    recent_views_30d: 68000,
    trial_received_at: "2026-06-22T00:00:00Z",
    b4: { rating: 3, comment: "정보 전달은 안정적이나 개인적 사용 맥락이 옅음." },
    c2: { level: 3, score: 18, evidence: ["스펙 비교 위주로 다룰 예정"] },
    c3: { level: 3, score: 15, evidence: [], ad_speak_flags: [] },
    c4: { level: 3, score: 9, evidence: [] },
  },
  {
    id: "p7",
    status: "신규",
    brand_name: "데모 브랜드",
    product_name: "가계부 앱 프리미엄",
    platform: "youtube",
    profile_name: "savvy_luna",
    profile_url: "https://www.youtube.com",
    profile_count: 9000,
    selected_categories: ["앱·서비스"],
    avg_views: "1만-10만",
    peak_views: 26000,
    collab_count: "1-3회",
    story_text:
      "이 가계부 앱을 8개월째 매일 쓰면서 고정지출 자동분류 덕에 카드값 예측이 처음으로 맞아떨어졌어요. 특히 주간 리포트를 캡처해서 저축 챌린지에 쓰는데, 그 흐름을 영상으로 보여주고 싶어요.",
    content_types: [{ label: "롱폼", count: 1 }],
    content_tone: "정보",
    expected_price: 25,
    reuse_allowed: true,
    upload_date: "2026.08.01 (토)",
    created_at: "2026-07-07T09:00:00Z",
    creator_type: "버추얼",
    creator_gender: "여성",
    audience_country: ["미국"],
    recent_views_30d: 30000,
    trial_received_at: "2026-06-08T00:00:00Z",
    b4: { rating: 5, comment: "사용 플로우가 구체적이고 콘텐츠 기획이 명확." },
    c2: {
      level: 5,
      score: 27,
      evidence: ["8개월째 매일 쓰면서", "고정지출 자동분류 덕에 카드값 예측이 처음으로 맞아떨어졌어요"],
    },
    c3: { level: 5, score: 22, evidence: ["주간 리포트를 캡처해서 저축 챌린지에 쓰는데"], ad_speak_flags: [] },
    c4: { level: 5, score: 13, evidence: [] },
  },
];
