// 위저드 CampaignForm ↔ campaigns DB row 매핑. (제품 필드는 products로 분리)
import type { CampaignForm } from "@/components/dashboard/seed-campaigns";
import type { DbCampaign, Product } from "@/components/dashboard/live/types";

const toInt = (s: string | undefined | null): number | null => {
  if (!s) return null;
  const n = Number(String(s).replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && String(s).trim() !== "" ? n : null;
};

// "2주"→2, "기타"+trialCustom→Number(trialCustom)
function trialWeeks(form: CampaignForm): number | null {
  if (form.trial === "기타") return toInt(form.trialCustom);
  const m = form.trial?.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

// 위저드 폼 → campaigns insert/update row (product_id는 별도 인자)
export function campaignRowFromForm(form: CampaignForm, brandId: string, productId: string | null) {
  const isDiscount = form.provision === "할인 판매";
  return {
    brand_id: brandId,
    product_id: productId,
    goal: form.goal || null,
    budget: toInt(form.budget),
    budget_mode: form.budgetSplit || null,
    target_ages: form.ages ?? [],
    target_gender: form.gender || null,
    target_locales: form.languages ?? [],
    platforms: (form.platforms ?? []).join(", ") || null,
    content_types: form.contentTypes ?? [],
    recruit_count: toInt(form.headcount),
    follower_ranges: form.sizeRanges ?? [],
    styles: form.styles ?? [],
    reference_handles: form.refAccounts ?? [],
    desired_vibe: form.wantFeel || null,
    avoid_note: form.avoidType || null,
    offer_type: isDiscount ? "discount" : "free",
    deal_mode: isDiscount ? form.dealMode : null,
    deal_value: isDiscount ? toInt(form.dealValue) : null,
    quantity: toInt(form.quantity),
    trial_weeks: trialWeeks(form),
    recruit_start: form.start || null,
    recruit_end: form.end || null,
    desired_post_date: form.postTBD ? null : (form.postStart || null),
    post_date_tbd: form.postTBD ?? false,
  };
}

// 새 제품 입력 → products insert row (기존 제품 선택 시엔 사용 안 함)
export function productRowFromForm(form: CampaignForm, brandId: string, imageUrl: string | null) {
  return {
    brand_id: brandId,
    name: form.product.trim(),
    category: form.category || null,
    description: form.intro.trim() || null,
    image_url: imageUrl,
    product_url: form.productUrl.trim() || null,
    visible: false,
  };
}

// campaigns row → 위저드 폼(수정 프리필). product는 연결 제품(있으면).
export function formFromCampaignRow(c: DbCampaign, product?: Product | null): Partial<CampaignForm> {
  const weeks = c.trial_weeks;
  const isPreset = weeks != null && weeks >= 1 && weeks <= 4;
  return {
    productId: c.product_id ?? undefined,
    product: product?.name ?? "",
    category: product?.category ?? "",
    intro: product?.description ?? "",
    imageUrl: product?.image_url ?? undefined,
    productUrl: product?.product_url ?? "",
    goal: c.goal ?? "",
    budget: c.budget != null ? String(c.budget) : "",
    budgetSplit: c.budget_mode ?? "",
    ages: c.target_ages ?? [],
    gender: c.target_gender ?? "",
    languages: c.target_locales ?? [],
    platforms: c.platforms ? c.platforms.split(", ").filter(Boolean) : [],
    contentTypes: c.content_types ?? [],
    headcount: c.recruit_count != null ? String(c.recruit_count) : "",
    sizeRanges: c.follower_ranges ?? [],
    styles: c.styles ?? [],
    refAccounts: c.reference_handles ?? [],
    wantFeel: c.desired_vibe ?? "",
    avoidType: c.avoid_note ?? "",
    provision: c.offer_type === "discount" ? "할인 판매" : "제품 무상 제공",
    dealMode: (c.deal_mode ?? "amount") as "amount" | "percent",
    dealValue: c.deal_value != null ? String(c.deal_value) : "",
    quantity: c.quantity != null ? String(c.quantity) : "1",
    trial: isPreset ? `${weeks}주` : weeks != null ? "기타" : "2주",
    trialCustom: isPreset || weeks == null ? "" : String(weeks),
    start: c.recruit_start ?? "",
    end: c.recruit_end ?? "",
    postStart: c.desired_post_date ?? "",
    postTBD: c.post_date_tbd ?? false,
  };
}
