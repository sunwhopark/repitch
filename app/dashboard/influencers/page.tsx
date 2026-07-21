import { Users } from "lucide-react";
import { LivePage, EmptyState } from "@/components/dashboard/live/empty-state";

export default function InfluencersPage() {
  return (
    <LivePage title="인플루언서 DB" description="캠페인에 맞는 크리에이터를 찾아봐요.">
      <EmptyState
        icon={Users}
        title="아직 매칭할 데이터가 없어요"
        description="캠페인을 만들고 역제안이 쌓이면, 조건에 맞는 크리에이터가 여기에서 매칭돼요."
      />
    </LivePage>
  );
}
