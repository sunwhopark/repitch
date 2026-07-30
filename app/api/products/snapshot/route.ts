// [지금 수집] 수동 트리거(브랜드 권한, 데모·검증용). 이 제품 1건만 즉시 수집 시도.
// 브랜드 세션으로 실행 → RLS(자기 제품)로 스냅샷 insert. 차단/실패 시 행 없이 조용히 반환.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSnapshot } from "@/lib/commerce";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  let productId = "";
  try { productId = (await request.json())?.productId ?? ""; } catch { /* noop */ }
  if (!productId) return NextResponse.json({ error: "productId 필요" }, { status: 400 });

  const { data: product } = await supabase
    .from("products")
    .select("id, product_url")
    .eq("id", productId)
    .eq("brand_id", user.id) // 본인 제품만
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "제품을 찾을 수 없거나 권한이 없어요." }, { status: 404 });
  if (!product.product_url) return NextResponse.json({ collected: false, reason: "상품 URL이 없어요." });

  const result = await fetchSnapshot(product.product_url);
  if (!result) {
    // 차단/구조변경/결측 — 정상 상태(행 만들지 않음).
    return NextResponse.json({ collected: false, reason: "이 URL에서 지금은 값을 수집하지 못했어요(차단되었거나 구조가 바뀌었을 수 있어요)." });
  }

  const captured_at = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("product_snapshots")
    .upsert({ product_id: productId, captured_at, source: result.source, ...result.data }, { onConflict: "product_id,captured_at" });
  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });

  return NextResponse.json({ collected: true, source: result.source, data: result.data });
}
