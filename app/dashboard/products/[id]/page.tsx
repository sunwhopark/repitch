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

  return <ProductDetailClient product={product} campaigns={campaigns ?? []} brandId={user!.id} />;
}
