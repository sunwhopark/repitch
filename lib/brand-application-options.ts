// Single source of truth for the brand application option values.
//
// IMPORTANT: the string values here must stay identical to the CHECK
// constraints on public.brand_applications (category / gender / brand_stage).
// The form sends these exact values, so editing one side means editing the
// other (note the middle dot "·" U+00B7 in 헬스·피트니스 / 앱·서비스).
export const BRAND_CATEGORIES = [
  "뷰티",
  "패션",
  "식품",
  "헬스·피트니스",
  "라이프스타일",
  "앱·서비스",
  "전자기기",
] as const;

export const BRAND_GENDERS = ["여성 중심", "남성 중심", "혼합"] as const;

// value → saved to DB (matches CHECK); label → shown in the UI.
export const BRAND_STAGES = [
  { value: "신생", label: "신생 (1년 이내)" },
  { value: "성장", label: "성장 (1~3년)" },
  { value: "기성", label: "기성 (3년 이상)" },
] as const;

// No DB CHECK on age_groups (stored as text[]).
export const BRAND_AGE_GROUPS = ["10대", "20대", "30대", "40대", "50대+"] as const;
