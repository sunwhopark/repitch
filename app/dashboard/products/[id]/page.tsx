import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "@/components/dashboard/live/product-detail-client";
import type { Product, ProductSnapshot, SnapshotEvent } from "@/components/dashboard/live/types";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("brand_id", user!.id)
    .single<Product>();

  if (!product) notFound();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, goal, status, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: false });

  // 이 제품으로 직접 도착한 역제안 수 (제품 상세 실연동)
  const { count: proposalCount } = await supabase
    .from("proposal_submissions")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  // 성과 시계열(최근 90일)
  const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const { data: snapshots } = await supabase
    .from("product_snapshots")
    .select("captured_at, rank, review_count, rating, price, revenue, order_count, source")
    .eq("product_id", id)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });

  // 이벤트 마커 — 이 제품 대상(직접 or 캠페인 경유) 역제안 중 '수락'된 건의 시점(게시 근사).
  const campaignIds = (campaigns ?? []).map((c) => c.id);
  const { data: proposals } = await supabase
    .from("proposal_submissions")
    .select("id, profile_name")
    .or(`product_id.eq.${id}${campaignIds.length ? `,campaign_id.in.(${campaignIds.join(",")})` : ""}`);
  const nameById = new Map((proposals ?? []).map((p) => [p.id, p.profile_name as string]));
  let events: SnapshotEvent[] = [];
  if (nameById.size > 0) {
    const { data: decisions } = await supabase
      .from("decisions")
      .select("proposal_id, decision, updated_at")
      .eq("brand_id", user!.id)
      .eq("decision", "accepted")
      .in("proposal_id", [...nameById.keys()]);
    events = (decisions ?? [])
      .filter((d) => d.updated_at)
      .map((d) => ({ date: String(d.updated_at).slice(0, 10), label: nameById.get(d.proposal_id) ?? "수락" }));
  }

  return (
    <ProductDetailClient
      product={product}
      campaigns={campaigns ?? []}
      brandId={user!.id}
      proposalCount={proposalCount ?? 0}
      snapshots={(snapshots ?? []) as ProductSnapshot[]}
      events={events}
    />
  );
}
