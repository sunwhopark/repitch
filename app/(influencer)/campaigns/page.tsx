import { createClient } from "@/lib/supabase/server";
import { CampaignsBrowse } from "@/components/influencer/campaigns-browse";
import type { ActiveCampaign, VisibleProduct } from "@/components/influencer/types";

// 공개 카탈로그 — 비로그인 접근 가능. 캠페인 + 입점 제품(세그먼트 토글).
export default async function CampaignsPage() {
  const supabase = await createClient();
  const [{ data: campaigns }, { data: products }] = await Promise.all([
    supabase.rpc("get_active_campaigns"),
    supabase.rpc("get_visible_products"),
  ]);
  return <CampaignsBrowse campaigns={(campaigns ?? []) as ActiveCampaign[]} products={(products ?? []) as VisibleProduct[]} />;
}
