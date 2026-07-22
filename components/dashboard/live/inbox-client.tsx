"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import {
  ProposalDetail,
  PlatformIcon,
  fmt,
  decisionBadge,
  type DecisionRecord,
} from "@/components/dashboard/proposal-detail";
import { decisionRowFromRecord } from "@/lib/scoring/adapters";
import type { ScoredProposal } from "@/lib/scoring";

export type InboxItem = {
  scored: ScoredProposal;
  id: string;
  campaignId: string | null;
  productId: string | null;
  targetType: "campaign" | "product" | "general";
  hasProfile: boolean;
  displayName: string;
  decision: DecisionRecord | null;
  visible: boolean;
  exclusionReason: string | null;
};

type TabKey = "received" | "협의" | "수락" | "거절";
const TABS: { key: TabKey; label: string }[] = [
  { key: "received", label: "받은 제안" },
  { key: "협의", label: "협의 중" },
  { key: "수락", label: "수락" },
  { key: "거절", label: "거절" },
];

const shortLabel = (s: string) => s.replace(" (점수에서 제외)", "");

function ListRow({ item, active, onClick }: { item: InboxItem; active: boolean; onClick: () => void }) {
  const s = item.scored;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full border-b border-border px-4 py-3 text-left transition-colors", active ? "bg-accent" : "hover:bg-foreground/[0.03]")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <PlatformIcon platform={s.proposal.platform} className="size-3.5 text-muted-foreground" />
            <span className="truncate text-sm font-semibold">{item.displayName}</span>
            <span className="text-xs text-muted-foreground">{fmt(s.proposal.profile_count)}</span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{s.proposal.product_name} · {s.proposal.expected_price}만원</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold tabular-nums">{Math.round(s.composite)}</div>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">{decisionBadge(item.decision ?? undefined, "신규")}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>적합 {Math.round(s.fit.score)}</span>
        <span>역량 {Math.round(s.quality.score)}</span>
        <span>진정성 {Math.round(s.auth.score)}</span>
      </div>
      {s.labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {s.labels.slice(0, 3).map((l) => (
            <span key={l} className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{shortLabel(l)}</span>
          ))}
        </div>
      )}
    </button>
  );
}

export function InboxClient({ items, brandId }: { items: InboxItem[]; brandId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("received");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => items.filter((i) => i.visible), [items]);
  const excluded = useMemo(() => items.filter((i) => !i.visible), [items]);

  const grouped = useMemo(() => {
    const g: Record<TabKey, InboxItem[]> = { received: [], 협의: [], 수락: [], 거절: [] };
    for (const it of visible) {
      const d = it.decision?.decision;
      if (!d) g.received.push(it);
      else g[d as TabKey].push(it);
    }
    return g;
  }, [visible]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  async function decide(rec: DecisionRecord) {
    if (!selected || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("decisions").upsert(decisionRowFromRecord(rec, selected.id, brandId), { onConflict: "proposal_id" });
    setSaving(false);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <Inbox className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold">아직 도착한 역제안이 없어요</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">캠페인을 열면 인플루언서의 제안을 받을 수 있어요.</p>
          </div>
          <a href="/dashboard/campaigns" className="mt-1 inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-bold text-background hover:bg-foreground/90">캠페인 관리</a>
        </div>
      </div>
    );
  }

  const list = grouped[tab];

  return (
    <div className="flex h-full">
      {/* 목록 */}
      <div className={cn("flex w-full flex-col border-r border-border md:w-[400px]", selected && "hidden md:flex")}>
        <div className="border-b border-border px-4 pt-4">
          <h1 className="text-lg font-semibold">역제안 인박스</h1>
          <div className="mt-3 flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition-colors", tab === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              >
                {t.label} {grouped[t.key].length}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">해당 상태의 제안이 없어요.</p>
          ) : (
            list.map((it) => <ListRow key={it.id} item={it} active={selectedId === it.id} onClick={() => setSelectedId(it.id)} />)
          )}

          {/* 조건 불일치 제외 (received 탭에서만) */}
          {tab === "received" && excluded.length > 0 && (
            <div className="border-t border-border">
              <button type="button" onClick={() => setShowExcluded((v) => !v)} className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground">
                <ChevronDown className={cn("size-3.5 transition-transform", showExcluded && "rotate-180")} />
                조건 불일치로 제외 {excluded.length}건
              </button>
              {showExcluded && excluded.map((it) => (
                <button key={it.id} type="button" onClick={() => setSelectedId(it.id)} className={cn("w-full border-t border-border px-4 py-3 text-left opacity-70 hover:opacity-100", selectedId === it.id && "bg-accent")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{it.displayName}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{it.exclusionReason}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상세 */}
      <div className={cn("min-w-0 flex-1", !selected && "hidden md:block")}>
        {selected ? (
          <ProposalDetail
            item={selected.scored}
            record={selected.decision}
            onDecision={decide}
            onBack={() => setSelectedId(null)}
            onClose={() => setSelectedId(null)}
            authAxisBadge="AI 분석 대기 (Phase 3)"
            banner={
              selected.campaignId ? (
                <a href={`/dashboard/campaigns/${selected.campaignId}`} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-[13px] hover:bg-muted">
                  <span className="font-medium">캠페인에서 진행 관리</span>
                  <ArrowRight className="size-4" />
                </a>
              ) : undefined
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">제안을 선택하면 상세와 산출 근거가 표시됩니다.</div>
        )}
      </div>
    </div>
  );
}
