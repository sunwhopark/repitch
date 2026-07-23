// Instagram 지표 새로고침 — 보관된 장기 토큰으로 프로필/평균 조회수 재수집.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIgProfile, getIgAvgViews } from "@/lib/instagram";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { data: tok } = await supabase.from("influencer_oauth").select("access_token").eq("influencer_id", user.id).maybeSingle();
  if (!tok?.access_token) return NextResponse.json({ error: "연동 정보가 없어요. 다시 연동해 주세요." }, { status: 400 });

  const profile = await getIgProfile(tok.access_token);
  if ("error" in profile) return NextResponse.json({ error: "토큰이 만료됐어요. 다시 연동해 주세요." }, { status: 400 });
  const avgViews = await getIgAvgViews(tok.access_token);

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
  await supabase.from("influencers").update({ channels: [...others, igEntry] }).eq("id", user.id);

  return NextResponse.json({ username: profile.username, followers: profile.followersCount, avgViews });
}
