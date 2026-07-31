import { createClient } from "@/lib/supabase/server";
import { InfluencersDirectory, type DirInfluencer, type DirCampaign } from "@/components/dashboard/live/influencers-directory";

export default async function InfluencersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: influencers }, { data: campaignRows }, { data: invites }] = await Promise.all([
    supabase.rpc("get_influencers"),
    supabase
      .from("campaigns")
      .select("id, goal, status, target_ages, target_gender, target_locales, product:products(category)")
      .eq("brand_id", user!.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.from("campaign_invitations").select("campaign_id, influencer_id").eq("brand_id", user!.id),
  ]);

  const campaigns: DirCampaign[] = (campaignRows ?? []).map((c) => {
    const { product, ...rest } = c as typeof c & { product: { category: string | null } | null };
    return { ...rest, product_category: product?.category ?? null } as DirCampaign;
  });

  // 이미 초대/지원한 (campaign,influencer) 쌍 → 모달에서 비활성.
  const invitedPairs = (invites ?? []).map((v) => `${v.campaign_id}:${v.influencer_id}`);
  const campaignIds = campaigns.map((c) => c.id);
  let appliedPairs: string[] = [];
  if (campaignIds.length) {
    const { data: apps } = await supabase.from("campaign_applications").select("campaign_id, influencer_id").in("campaign_id", campaignIds);
    appliedPairs = (apps ?? []).map((a) => `${a.campaign_id}:${a.influencer_id}`);
  }

  return (
    <InfluencersDirectory
      influencers={(influencers ?? []) as DirInfluencer[]}
      campaigns={campaigns}
      invitedPairs={invitedPairs}
      appliedPairs={appliedPairs}
      brandId={user!.id}
    />
  );
}
