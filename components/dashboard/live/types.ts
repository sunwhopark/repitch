// 실서비스(인증 대시보드) DB row 타입. 시드(seed-campaigns 등)와 별개 — /demo 전용 시드는 유지.

export type Product = {
  id: string;
  brand_id: string;
  name: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  sales_channel: string | null;
  product_url: string | null;
  visible: boolean;
  created_at: string;
};

export type DbCampaign = {
  id: string;
  brand_id: string;
  product_id: string | null;
  goal: string | null;
  budget: number | null;
  budget_mode: string | null;
  target_ages: string[];
  target_gender: string | null;
  target_locales: string[];
  platforms: string | null;
  content_types: string[];
  recruit_count: number | null;
  follower_ranges: string[];
  styles: string[];
  reference_handles: string[];
  desired_vibe: string | null;
  avoid_note: string | null;
  offer_type: "free" | "discount" | null;
  deal_mode: "amount" | "percent" | null;
  deal_value: number | null;
  quantity: number | null;
  trial_weeks: number | null;
  recruit_start: string | null;
  recruit_end: string | null;
  desired_post_date: string | null;
  post_date_tbd: boolean;
  status: "draft" | "active" | "ended";
  created_at: string;
  // 조인(선택)
  product?: Pick<Product, "id" | "name" | "image_url"> | null;
};

export type ApplicationStatus =
  | "applied"
  | "selected"
  | "held"
  | "shipped"
  | "in_trial"
  | "proposal_sent"
  | "not_selected";

export type CampaignApplication = {
  id: string;
  campaign_id: string;
  influencer_id: string;
  ship_recipient: string | null;
  ship_phone: string | null;
  ship_address: string | null;
  third_party_consent_at: string;
  status: ApplicationStatus;
  hold_reason: string | null;
  hold_memo: string | null;
  courier: string | null;
  tracking_no: string | null;
  selected_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export const SALES_CHANNELS = ["올리브영", "쿠팡", "네이버 스마트스토어", "자사몰", "기타"] as const;

export const CAMPAIGN_STATUS_LABEL: Record<DbCampaign["status"], string> = {
  draft: "임시저장",
  active: "진행 중",
  ended: "종료",
};

export const won = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toLocaleString("ko-KR")}원`;
