import { Package } from "lucide-react";
import { LivePage, EmptyState } from "@/components/dashboard/live/empty-state";

export default function ProductsPage() {
  return (
    <LivePage title="제품" description="체험단·캠페인에 쓸 제품을 관리해요.">
      <EmptyState
        icon={Package}
        title="등록된 제품이 없어요"
        description="캠페인을 만들 때 제품 정보를 입력하면 여기에 모여요."
      />
    </LivePage>
  );
}
