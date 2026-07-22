import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetail } from "@/components/influencer/product-detail";
import type { VisibleProduct } from "@/components/influencer/types";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: list } = await supabase.rpc("get_visible_products");
  const product = ((list ?? []) as VisibleProduct[]).find((p) => p.id === id);
  if (!product) notFound();

  let isInfluencer = false;
  if (user) {
    const { data: inf } = await supabase.from("influencers").select("id").eq("id", user.id).maybeSingle();
    isInfluencer = !!inf;
  }

  return <ProductDetail product={product} loggedIn={!!user} isInfluencer={isInfluencer} />;
}
