import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "@/components/dashboard/live/product-detail-client";
import type { Product } from "@/components/dashboard/live/types";

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

  return <ProductDetailClient product={product} campaigns={campaigns ?? []} brandId={user!.id} proposalCount={proposalCount ?? 0} />;
}
