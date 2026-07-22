import { Users } from "lucide-react";
import { LivePage, EmptyState } from "@/components/dashboard/live/empty-state";

export default function InfluencersPage() {
  return (
    <LivePage title="인플루언서 DB" description="캠페인에 맞는 크리에이터를 찾아봐요.">
      <EmptyState
        icon={Users}
        title="아직 등록된 인플루언서가 없어요"
        description="인플루언서 가입이 시작되면 여기서 조건에 맞는 크리에이터를 탐색할 수 있어요."
      />
    </LivePage>
  );
}
