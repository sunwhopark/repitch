"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { CreateCampaignModal } from "@/components/ui/create-campaign-modal";
import type { Campaign } from "@/components/dashboard/seed-campaigns";
import { EmptyState } from "@/components/dashboard/live/empty-state";

export default function CampaignsPage() {
  // Phase 2: brands 실테이블(campaigns)에 연결. 지금은 세션 메모리 — 새로고침 시 초기화.
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">캠페인</h1>
            <p className="mt-1 text-sm text-muted-foreground">체험단·협업 캠페인을 만들고 관리해요.</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-bold text-background hover:bg-foreground/90"
          >
            <Plus className="size-4" /> 새 캠페인
          </button>
        </div>

        <div className="mt-6">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="아직 캠페인이 없어요"
              description="첫 캠페인을 만들어 크리에이터 모집을 시작해 보세요."
              action={
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:bg-foreground/90"
                >
                  캠페인 만들기
                </button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {campaigns.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.product}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{c.status}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{c.offer}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.period}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateCampaignModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(c) => {
          setCampaigns((prev) => [c, ...prev]); // Phase 2에서 DB 저장으로 교체
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
