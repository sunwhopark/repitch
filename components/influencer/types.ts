// 인플루언서 화면 데이터 타입(정의 함수 반환 shape).

export type ActiveCampaign = {
  id: string;
  brand_name: string | null;
  goal: string | null;
  target_ages: string[] | null;
  target_gender: string | null;
  target_locales: string[] | null;
  platforms: string | null;
  content_types: string[] | null;
  recruit_count: number | null;
  follower_ranges: string[] | null;
  styles: string[] | null;
  reference_handles: string[] | null;
  desired_vibe: string | null;
  offer_type: "free" | "discount" | null;
  deal_mode: "amount" | "percent" | null;
  deal_value: number | null;
  quantity: number | null;
  trial_weeks: number | null;
  recruit_start: string | null;
  recruit_end: string | null;
  desired_post_date: string | null;
  post_date_tbd: boolean;
  created_at: string;
  product_id: string | null;
  product_name: string | null;
  product_image_url: string | null;
  product_category: string | null;
};

export type VisibleProduct = {
  id: string;
  brand_name: string | null;
  name: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  sales_channel: string | null;
  product_url: string | null;
};

export type MyApplicationRow = {
  application: {
    id: string;
    campaign_id: string;
    status: "applied" | "selected" | "held" | "shipped" | "in_trial" | "proposal_sent" | "not_selected";
    ship_recipient: string | null;
    ship_phone: string | null;
    ship_address: string | null;
    courier: string | null;
    tracking_no: string | null;
    selected_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    created_at: string;
  };
  campaign: {
    id: string;
    brand_name: string | null;
    status: string;
    goal: string | null;
    offer_type: "free" | "discount" | null;
    deal_mode: "amount" | "percent" | null;
    deal_value: number | null;
    quantity: number | null;
    trial_weeks: number | null;
    recruit_start: string | null;
    recruit_end: string | null;
    product_name: string | null;
    product_image_url: string | null;
    product_category: string | null;
  };
};

export type MySentProposalRow = {
  proposal: { id: string; created_at: string; platform: string; expected_price: number | null };
  target: {
    target_type: "campaign" | "product" | "general";
    brand_name: string | null;
    product_name: string | null;
    product_image_url: string | null;
    campaign_id: string | null;
    product_id: string | null;
  };
  decision: { decision: "rejected" | "negotiating" | "accepted"; reasons: string[] | null; nego_discount_pct: number | null; memo: string | null; updated_at: string } | null;
};

export type InfluencerProfile = {
  id: string;
  display_name: string | null;
  channels: {
    platform: string;
    handle: string;
    follower_count: number | null;
    avg_views: number | null;
    verified?: boolean;
    verified_at?: string;
    channel_id?: string;
    title?: string;
  }[] | null;
  category: string[] | null;
  creator_type: string | null;
  gender: string | null;
  countries: string[] | null;
  ship_recipient: string | null;
  ship_phone: string | null;
  ship_address: string | null;
};

export function offerLabel(offer_type: string | null, deal_mode: string | null, deal_value: number | null): string {
  if (offer_type === "discount") {
    return deal_mode === "percent" ? `${deal_value ?? 0}% 할인` : `${(deal_value ?? 0).toLocaleString("ko-KR")}원 판매`;
  }
  return "제품 무상 제공";
}

export const won = (n: number | null | undefined) => (n == null ? "—" : `${n.toLocaleString("ko-KR")}원`);
export const fmtMD = (iso: string | null) => (iso ? `${+iso.split("-")[1]}/${+iso.split("-")[2]}` : "");
export const fmtCount = (n: number | null | undefined) =>
  n == null ? "—" : n >= 10000 ? `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}만` : n.toLocaleString();

export const APP_STATUS: Record<MyApplicationRow["application"]["status"], { label: string; solid?: boolean }> = {
  applied: { label: "지원함" },
  selected: { label: "선정됨", solid: true },
  held: { label: "보류" },
  shipped: { label: "발송됨", solid: true },
  in_trial: { label: "체험 중", solid: true },
  proposal_sent: { label: "역제안 보냄", solid: true },
  not_selected: { label: "미선정" },
};
