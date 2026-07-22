import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProposalForm, type ProposalContext } from "@/components/influencer/proposal-form";
import type { InfluencerProfile, MyApplicationRow, VisibleProduct } from "@/components/influencer/types";

export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ application?: string; product?: string }> }) {
  const { application, product } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("influencers").select("*").eq("id", user.id).maybeSingle<InfluencerProfile>();
  if (!profile) redirect("/dashboard");

  let ctx: ProposalContext;
  if (application) {
    const { data: apps } = await supabase.rpc("get_my_applications");
    const row = ((apps ?? []) as MyApplicationRow[]).find((r) => r.application.id === application);
    if (!row) notFound();
    ctx = {
      targetType: "campaign",
      campaignId: row.campaign.id,
      productId: null,
      applicationId: application,
      brandName: row.campaign.brand_name,
      productName: row.campaign.product_name,
      imageUrl: row.campaign.product_image_url,
      ship: { recipient: row.application.ship_recipient, phone: row.application.ship_phone, address: row.application.ship_address },
    };
  } else if (product) {
    const { data: list } = await supabase.rpc("get_visible_products");
    const p = ((list ?? []) as VisibleProduct[]).find((x) => x.id === product);
    if (!p) notFound();
    ctx = { targetType: "product", campaignId: null, productId: product, applicationId: null, brandName: p.brand_name, productName: p.name, imageUrl: p.image_url, ship: null };
  } else {
    notFound();
  }

  return <ProposalForm ctx={ctx} profile={profile} email={user.email} />;
}
