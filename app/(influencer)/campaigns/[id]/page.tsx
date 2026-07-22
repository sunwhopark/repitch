import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignDetail } from "@/components/influencer/campaign-detail";
import type { ActiveCampaign, InfluencerProfile } from "@/components/influencer/types";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: list } = await supabase.rpc("get_active_campaigns");
  const campaign = ((list ?? []) as ActiveCampaign[]).find((c) => c.id === id);
  if (!campaign) notFound();

  let profile: InfluencerProfile | null = null;
  let applied = false;
  if (user) {
    const { data: inf } = await supabase.from("influencers").select("*").eq("id", user.id).maybeSingle<InfluencerProfile>();
    profile = inf ?? null;
    if (inf) {
      const { data: app } = await supabase.from("campaign_applications").select("id").eq("campaign_id", id).eq("influencer_id", user.id).maybeSingle();
      applied = !!app;
    }
  }

  return <CampaignDetail campaign={campaign} profile={profile} loggedIn={!!user} isInfluencer={!!profile} alreadyApplied={applied} />;
}
