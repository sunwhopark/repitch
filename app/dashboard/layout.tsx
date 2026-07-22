import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthedShell } from "@/components/dashboard/live/authed-shell";
import { ApprovalPending } from "@/components/auth/approval-pending";
import { getInboxItems, inboxUnreadCount } from "@/lib/dashboard/inbox-data";
import type { BrandProfile } from "@/components/dashboard/live/profile-edit-modal";

// 인증 전용 대시보드. proxy.ts가 1차 방어(비로그인 → /login), 여기서 브랜드 행을
// 읽어 승인 게이트를 판정한다. (layout은 client 내비게이션마다 재실행되지 않으므로
// 라우트 보호의 주 방어선은 proxy.)
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // select("*") — weights 컬럼(0014)이 아직 없어도 안전(있으면 포함).
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", user.id)
    .single<BrandProfile>();

  // 미승인(또는 트리거 지연으로 행이 아직 없는 경우) → 승인 대기 화면.
  if (!brand || !brand.approved) {
    return <ApprovalPending brandName={brand?.brand_name} />;
  }

  const inboxCount = inboxUnreadCount(await getInboxItems(supabase, user.id));

  return <AuthedShell brand={brand} inboxCount={inboxCount}>{children}</AuthedShell>;
}
