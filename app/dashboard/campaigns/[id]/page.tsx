import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignDetailClient } from "@/components/dashboard/live/campaign-detail-client";
import type { DbCampaign, Product, CampaignApplication } from "@/components/dashboard/live/types";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, product:products(*)")
    .eq("id", id)
    .eq("brand_id", user!.id)
    .single();

  if (!campaign) notFound();

  const { data: applications } = await supabase
    .from("campaign_applications")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  // 지원자 공개 프로필(활동명·인증) — influencers RLS로 직접 조인 불가 → definer 병합.
  const { data: applicantProfiles } = await supabase.rpc("get_campaign_applicant_profiles", { p_campaign_id: id });
  const profileByInf = new Map(
    ((applicantProfiles ?? []) as { influencer_id: string; display_name: string | null; verified: boolean }[]).map((p) => [p.influencer_id, p]),
  );
  const mergedApplications = ((applications ?? []) as CampaignApplication[]).map((a) => {
    const prof = profileByInf.get(a.influencer_id);
    return { ...a, verified: prof?.verified ?? false, display_name: prof?.display_name ?? null };
  });

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("brand_id", user!.id)
    .order("created_at", { ascending: false });

  // 이 캠페인으로 도착한 역제안 수 (역제안 도착 funnel 실연결)
  const { count: proposalCount } = await supabase
    .from("proposal_submissions")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", id);

  const { product, ...rest } = campaign as DbCampaign & { product: Product | null };

  return (
    <CampaignDetailClient
      campaign={{ ...rest, product } as DbCampaign}
      product={(product ?? null) as Product | null}
      applications={mergedApplications}
      products={products ?? []}
      brandId={user!.id}
      proposalCount={proposalCount ?? 0}
    />
  );
}
