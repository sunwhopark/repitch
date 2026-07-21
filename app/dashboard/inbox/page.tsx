import { Inbox } from "lucide-react";
import { LivePage, EmptyState } from "@/components/dashboard/live/empty-state";

export default function InboxPage() {
  return (
    <LivePage title="역제안 인박스" description="크리에이터가 보낸 역제안을 검토해요.">
      <EmptyState
        icon={Inbox}
        title="받은 역제안이 없어요"
        description="크리에이터가 보낸 역제안이 도착하면 여기에서 검토·협의·수락할 수 있어요."
      />
    </LivePage>
  );
}
