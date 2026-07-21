import { Wallet } from "lucide-react";
import { LivePage, EmptyState } from "@/components/dashboard/live/empty-state";

export default function SettlementPage() {
  return (
    <LivePage title="정산" description="캠페인별 정산 내역과 지급 상태를 확인해요.">
      <EmptyState
        icon={Wallet}
        title="정산 내역이 없어요"
        description="캠페인이 종료되고 지급이 진행되면 국내·해외 정산 내역이 여기에 표시돼요."
      />
    </LivePage>
  );
}
