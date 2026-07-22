import { createClient } from "@/lib/supabase/server";
import { CampaignsBrowse } from "@/components/influencer/campaigns-browse";
import type { ActiveCampaign } from "@/components/influencer/types";

// 공개 카탈로그 — 비로그인 접근 가능. get_active_campaigns(anon 허용).
export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_active_campaigns");
  return <CampaignsBrowse campaigns={(data ?? []) as ActiveCampaign[]} />;
}
