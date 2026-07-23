// Instagram 연동 해제 — 토큰 삭제 + instagram 채널 verified 해제(수동 입력 폴백으로 되돌림).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  await supabase.from("influencer_oauth").delete().eq("influencer_id", user.id);

  const { data: row } = await supabase.from("influencers").select("channels").eq("id", user.id).single();
  const existing = (Array.isArray(row?.channels) ? row!.channels : []) as { platform?: string; handle?: string }[];
  const next = existing.map((c) =>
    c.platform === "instagram"
      ? { platform: "instagram", handle: c.handle ?? "", follower_count: null, avg_views: null, verified: false }
      : c,
  );
  await supabase.from("influencers").update({ channels: next }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
