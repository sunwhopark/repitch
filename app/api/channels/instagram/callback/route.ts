// Instagram OAuth 콜백 — code→토큰 교환(장기 전환)→프로필/인사이트→channels 저장·토큰 보관.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken, getLongLivedToken, getIgProfile, getIgAvgViews, igCallbackUri } from "@/lib/instagram";

const back = (req: NextRequest, status: string) => NextResponse.redirect(new URL(`/me?ig=${status}`, req.nextUrl.origin));

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) return back(req, "denied"); // 사용자가 동의 거부

  const code = sp.get("code");
  const state = sp.get("state");
  const cookieState = req.cookies.get("ig_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return back(req, "error");

  // 로그인 사용자(인플루언서) 확인 — 콜백은 최상위 내비게이션이라 세션 쿠키 전달됨.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return back(req, "error");

  // 1) code → 단기 토큰
  const short = await exchangeCodeForToken(code, igCallbackUri(req.nextUrl.origin));
  if ("error" in short) return back(req, "error");
  // 2) 단기 → 장기 토큰(60일)
  const long = await getLongLivedToken(short.accessToken);
  if ("error" in long) return back(req, "error");
  // 3) 프로필 + 평균 조회수(베스트에포트)
  const profile = await getIgProfile(long.accessToken);
  if ("error" in profile) return back(req, "error");
  const avgViews = await getIgAvgViews(long.accessToken);

  // 4) channels jsonb 갱신 — instagram 항목을 인증본으로 교체(계정 1개 가정).
  const { data: row } = await supabase.from("influencers").select("channels").eq("id", user.id).single();
  const existing = (Array.isArray(row?.channels) ? row!.channels : []) as { platform?: string }[];
  const others = existing.filter((c) => c.platform !== "instagram");
  const igEntry = {
    platform: "instagram",
    handle: profile.username,
    follower_count: profile.followersCount,
    avg_views: avgViews,
    verified: true,
    verified_at: new Date().toISOString(),
    ig_user_id: profile.igUserId,
  };
  const { error: upErr } = await supabase.from("influencers").update({ channels: [...others, igEntry] }).eq("id", user.id);
  if (upErr) return back(req, "error");

  // 5) 장기 토큰 보관(별도 테이블, 서버 전용). 만료 시각 기록.
  const expiresAt = long.expiresIn ? new Date(Date.now() + long.expiresIn * 1000).toISOString() : null;
  await supabase.from("influencer_oauth").upsert(
    { influencer_id: user.id, provider: "instagram", access_token: long.accessToken, token_expires_at: expiresAt, ig_user_id: profile.igUserId, updated_at: new Date().toISOString() },
    { onConflict: "influencer_id" },
  );

  const res = back(req, "connected");
  res.cookies.delete("ig_oauth_state");
  return res;
}
