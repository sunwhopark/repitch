// Instagram API with Instagram Login(비즈니스/크리에이터) — 서버 전용 헬퍼.
// META_APP_ID/META_APP_SECRET는 서버에서만 읽는다(클라이언트 미노출).
// 플로우: authorize → code → 단기토큰 → 장기토큰(60일) → 프로필/인사이트.
// 문서 기준 scope: instagram_business_basic, instagram_business_manage_insights.
const AUTHORIZE = "https://www.instagram.com/oauth/authorize";
const TOKEN = "https://api.instagram.com/oauth/access_token"; // 단기 토큰 교환
const GRAPH = "https://graph.instagram.com"; // 장기 토큰·프로필·인사이트
export const IG_SCOPES = "instagram_business_basic,instagram_business_manage_insights";

export function igAppId() {
  return process.env.META_APP_ID ?? "";
}

// 콜백 redirect_uri — authorize·token 교환에서 완전히 동일해야 함(Meta 등록값과 일치).
// 프로덕션은 NEXT_PUBLIC_SITE_URL로 고정(repitch.kr), 없으면 요청 origin.
export function igCallbackUri(reqOrigin: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || reqOrigin;
  return `${origin.replace(/\/$/, "")}/api/channels/instagram/callback`;
}
export function igConfigured() {
  return !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function igAuthorizeUrl(redirectUri: string, state: string) {
  const u = new URL(AUTHORIZE);
  u.searchParams.set("client_id", igAppId());
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", IG_SCOPES);
  u.searchParams.set("state", state);
  return u.toString();
}

// code → 단기 액세스 토큰(+ ig user_id)
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{ accessToken: string; userId: string } | { error: string }> {
  const body = new URLSearchParams({
    client_id: igAppId(),
    client_secret: process.env.META_APP_SECRET ?? "",
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.access_token) return { error: json.error_message ?? json.error?.message ?? "토큰 교환 실패" };
  return { accessToken: String(json.access_token), userId: String(json.user_id) };
}

// 단기 → 장기 토큰(60일)
export async function getLongLivedToken(shortToken: string): Promise<{ accessToken: string; expiresIn: number } | { error: string }> {
  const u = new URL(`${GRAPH}/access_token`);
  u.searchParams.set("grant_type", "ig_exchange_token");
  u.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
  u.searchParams.set("access_token", shortToken);
  const res = await fetch(u, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.access_token) return { error: json.error?.message ?? "장기 토큰 발급 실패" };
  return { accessToken: String(json.access_token), expiresIn: Number(json.expires_in ?? 0) };
}

// 장기 토큰 갱신(만료 전 재발급) — 추후 크론/재검증에서 사용.
export async function refreshLongLivedToken(token: string): Promise<{ accessToken: string; expiresIn: number } | { error: string }> {
  const u = new URL(`${GRAPH}/refresh_access_token`);
  u.searchParams.set("grant_type", "ig_refresh_token");
  u.searchParams.set("access_token", token);
  const res = await fetch(u, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.access_token) return { error: json.error?.message ?? "토큰 갱신 실패" };
  return { accessToken: String(json.access_token), expiresIn: Number(json.expires_in ?? 0) };
}

export type IgProfile = { igUserId: string; username: string; accountType: string | null; followersCount: number | null; mediaCount: number | null };

export async function getIgProfile(token: string): Promise<IgProfile | { error: string }> {
  const u = new URL(`${GRAPH}/me`);
  u.searchParams.set("fields", "user_id,username,account_type,followers_count,media_count");
  u.searchParams.set("access_token", token);
  const res = await fetch(u, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.username) return { error: json.error?.message ?? "프로필 조회 실패" };
  return {
    igUserId: String(json.user_id ?? ""),
    username: String(json.username),
    accountType: json.account_type ?? null,
    followersCount: json.followers_count == null ? null : Number(json.followers_count),
    mediaCount: json.media_count == null ? null : Number(json.media_count),
  };
}

// 최근 미디어의 views 평균(베스트에포트). views 미지원 미디어는 건너뜀 — 값이 없으면 null.
export async function getIgAvgViews(token: string): Promise<number | null> {
  const u = new URL(`${GRAPH}/me/media`);
  u.searchParams.set("fields", "id,media_type,media_product_type");
  u.searchParams.set("limit", "10");
  u.searchParams.set("access_token", token);
  const res = await fetch(u, { cache: "no-store" });
  const json = await res.json();
  const items: { id: string }[] = res.ok && Array.isArray(json.data) ? json.data : [];
  if (!items.length) return null;

  const views: number[] = [];
  for (const m of items) {
    try {
      const iu = new URL(`${GRAPH}/${m.id}/insights`);
      iu.searchParams.set("metric", "views");
      iu.searchParams.set("access_token", token);
      const r = await fetch(iu, { cache: "no-store" });
      const j = await r.json();
      const v = j?.data?.[0]?.values?.[0]?.value ?? j?.data?.[0]?.total_value?.value;
      if (typeof v === "number") views.push(v);
    } catch {
      /* 이 미디어는 views 미지원 — 건너뜀 */
    }
  }
  if (!views.length) return null;
  return Math.round(views.reduce((a, b) => a + b, 0) / views.length);
}
