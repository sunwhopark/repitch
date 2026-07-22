import { createClient } from "@/lib/supabase/server";
import { ProductsClient } from "@/components/dashboard/live/products-client";
import type { Product } from "@/components/dashboard/live/types";

// 자기 브랜드 제품 목록(실테이블). RLS가 brand_id=uid를 보장하지만 쿼리도 명시.
export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", user!.id)
    .order("created_at", { ascending: false });

  return <ProductsClient products={(data ?? []) as Product[]} brandId={user!.id} />;
}
