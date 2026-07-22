import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignForm } from "@/components/dashboard/seed-campaigns";
import { campaignRowFromForm, productRowFromForm } from "@/components/dashboard/live/campaign-map";

// 위저드 폼 → 실저장. 새 제품 입력이면 products insert(+이미지 Storage) 후 연결.
// campaignId 있으면 update, 없으면 insert. (create/edit 공용)
export async function saveCampaignFromForm(
  supabase: SupabaseClient,
  form: CampaignForm,
  brandId: string,
  campaignId?: string,
): Promise<{ error: string | null }> {
  let productId = form.productId ?? null;

  if (!productId && form.product.trim()) {
    // 이미지: 위저드는 objectURL(blob:)로 미리보기 → blob 재취득 후 Storage 업로드
    let imageUrl: string | null = null;
    if (form.imageUrl?.startsWith("blob:")) {
      const blob = await fetch(form.imageUrl).then((r) => r.blob());
      const ext = blob.type.split("/")[1] || "jpg";
      const path = `${brandId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, blob);
      if (upErr) return { error: "이미지 업로드에 실패했어요. (버킷 product-images 확인)" };
      imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    } else if (form.imageUrl && !form.imageUrl.startsWith("blob:")) {
      imageUrl = form.imageUrl;
    }
    const { data, error } = await supabase
      .from("products")
      .insert(productRowFromForm(form, brandId, imageUrl))
      .select("id")
      .single();
    if (error || !data) return { error: "제품 저장에 실패했어요." };
    productId = data.id as string;
  }

  const row = campaignRowFromForm(form, brandId, productId);
  const { error } = campaignId
    ? await supabase.from("campaigns").update(row).eq("id", campaignId)
    : await supabase.from("campaigns").insert(row);
  return { error: error ? "캠페인 저장에 실패했어요." : null };
}
