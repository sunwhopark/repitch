import { LayoutDashboard } from "lucide-react";
import { LivePage, EmptyState } from "@/components/dashboard/live/empty-state";

export default function DashboardHome() {
  return (
    <LivePage title="대시보드" description="최근 캠페인 성과가 여기에 모여요.">
      <EmptyState
        icon={LayoutDashboard}
        title="아직 데이터가 없어요"
        description="첫 캠페인을 만들면 도달·참여·정산 성과가 이 화면에 표시돼요."
        action={
          <a href="/dashboard/campaigns" className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:bg-foreground/90">
            캠페인 만들기
          </a>
        }
      />
    </LivePage>
  );
}
