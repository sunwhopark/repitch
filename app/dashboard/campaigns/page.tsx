"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEED_CAMPAIGNS, type Campaign } from "@/components/dashboard/seed-campaigns";

function StatusBadge({ status }: { status: Campaign["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "진행 중" ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function CampaignCard({ c, onClick }: { c: Campaign; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-foreground/[0.03]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{c.product}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{c.period} · {c.offer}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>신청 <b className="font-semibold text-foreground tabular-nums">{c.funnel.applied}</b></span>
        <span>발송 <b className="font-semibold text-foreground tabular-nums">{c.funnel.shipped}</b></span>
        <span>역제안 <b className="font-semibold text-foreground tabular-nums">{c.funnel.proposals}</b></span>
      </div>
    </button>
  );
}

function Section({ id, title, items, onOpen }: {
  id: string;
  title: string;
  items: Campaign[];
  onOpen: (id: string) => void;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
        {title}
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {items.length}
        </span>
      </h2>
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <CampaignCard key={c.id} c={c} onClick={() => onOpen(c.id)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">해당 캠페인이 없어요.</p>
      )}
    </section>
  );
}

export default function CampaignsPage() {
  const router = useRouter();
  const [toast, setToast] = useState(false);

  const active = SEED_CAMPAIGNS.filter((c) => c.status === "진행 중");
  const ended = SEED_CAMPAIGNS.filter((c) => c.status === "종료");

  // Sidebar 진행 중/종료 submenu links via #active / #ended.
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace("#", "");
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  const showToast = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2500);
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">캠페인</h1>
            <p className="mt-1 text-sm text-muted-foreground">체험단을 열고 진행 상황을 관리해요.</p>
          </div>
          <button
            type="button"
            onClick={showToast}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            <Plus className="size-4" /> 새 캠페인
          </button>
        </div>

        <div className="mt-8 space-y-10">
          <Section id="active" title="진행 중" items={active} onOpen={(id) => router.push(`/dashboard/campaigns/${id}`)} />
          <Section id="ended" title="종료" items={ended} onOpen={(id) => router.push(`/dashboard/campaigns/${id}`)} />
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          새 캠페인 위저드는 준비 중이에요.
        </div>
      )}
    </div>
  );
}
