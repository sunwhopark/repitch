import { createClient } from "@/lib/supabase/server";
import { CampaignsClient } from "@/components/dashboard/live/campaigns-client";
import type { DbCampaign } from "@/components/dashboard/live/types";

// 자기 브랜드 캠페인 목록(실테이블, 제품 조인). Phase 2에서 메모리 → DB로.
export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, product:products(id, name, image_url)")
    .eq("brand_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("brand_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <CampaignsClient
      campaigns={(campaigns ?? []) as DbCampaign[]}
      products={products ?? []}
      brandId={user!.id}
    />
  );
}
