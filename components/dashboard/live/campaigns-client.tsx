"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { CreateCampaignModal } from "@/components/ui/create-campaign-modal";
import { EmptyState } from "@/components/dashboard/live/empty-state";
import { saveCampaignFromForm } from "@/components/dashboard/live/save-campaign";
import { CAMPAIGN_STATUS_LABEL, type DbCampaign } from "@/components/dashboard/live/types";

const fmtMD = (iso: string | null) => {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${+m}/${+d}`;
};

export function CampaignsClient({
  campaigns,
  products,
  brandId,
}: {
  campaigns: DbCampaign[];
  products: { id: string; name: string }[];
  brandId: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
                <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:bg-foreground/90">
                  캠페인 만들기
                </button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                  className="overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:bg-foreground/[0.02]"
                >
                  <div className="aspect-[16/9] w-full bg-muted">
                    {c.product?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.product.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/40"><Megaphone className="size-7" /></div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{c.product?.name ?? c.goal ?? "캠페인"}</span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", c.status === "active" ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
                        {CAMPAIGN_STATUS_LABEL[c.status]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {(c.recruit_start || c.recruit_end) && <span>{fmtMD(c.recruit_start)} – {fmtMD(c.recruit_end)}</span>}
                      {c.recruit_count != null && <span>· 모집 {c.recruit_count}명</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateCampaignModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        products={products}
        onSubmit={async (c) => {
          if (saving || !c.form) return;
          setSaving(true);
          const supabase = createClient();
          const { error } = await saveCampaignFromForm(supabase, c.form, brandId);
          setSaving(false);
          if (error) { alert(error); return; }
          setCreateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
