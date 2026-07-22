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
      applications={(applications ?? []) as CampaignApplication[]}
      products={products ?? []}
      brandId={user!.id}
      proposalCount={proposalCount ?? 0}
    />
  );
}
