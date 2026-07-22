import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/influencer/profile-form";
import type { InfluencerProfile } from "@/components/influencer/types";

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("influencers").select("*").eq("id", user.id).maybeSingle<InfluencerProfile>();
  if (!profile) redirect("/dashboard"); // 브랜드 계정 → 인플루언서 프로필 없음
  return <ProfileForm profile={profile} />;
}
