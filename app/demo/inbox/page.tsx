"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Inbox, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { DashboardFilters } from "@/components/dashboard/filter-modal";
import { scoreAll, passesFilters, exclusionReason, type ScoredProposal } from "@/lib/scoring";
import { SEED_CAMPAIGNS } from "@/components/dashboard/seed-campaigns";
import { ProposalDetail, PlatformIcon, fmt, decisionBadge } from "@/components/dashboard/proposal-detail";

const shortLabel = (l: string) => l.replace(" (점수에서 제외)", "");
const originCampaignId = (proposalId: string) =>
  SEED_CAMPAIGNS.find((c) => c.creators.some((cr) => cr.proposalId === proposalId))?.id ?? null;

type TabKey = "received" | "협의" | "수락" | "거절";
const TABS: { key: TabKey; label: string }[] = [
  { key: "received", label: "받은 제안" },
  { key: "협의", label: "협의 중" },
  { key: "수락", label: "수락" },
  { key: "거절", label: "거절" },
];

// ── List row ────────────────────────────────────────────────────────
function ListRow({ item, selected, badge, onClick, onManage }: {
  item: ScoredProposal;
  selected: boolean;
  badge: string;
  onClick: () => void;
  onManage?: () => void;
}) {
  const p = item.proposal;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1.5 border-b border-border px-4 py-3.5 text-left transition-colors",
        selected ? "bg-muted" : "hover:bg-foreground/[0.03]",
      )}
    >
      <div className="flex items-center gap-2">
        <PlatformIcon platform={p.platform} className="size-4 shrink-0 text-foreground/70" />
        <span className="truncate text-sm font-bold">{p.profile_name}</span>
        <span className="text-xs text-muted-foreground">{fmt(p.profile_count)}</span>
        <span className="ml-auto text-lg font-extrabold tabular-nums tracking-tight">{Math.round(item.composite)}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">{p.product_name} · {p.expected_price}만원</span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <ListBadge label={badge} dark />
        {item.labels.map((l) => <ListBadge key={l} label={shortLabel(l)} />)}
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span>적합도<b className="ml-1 font-bold text-foreground">{Math.round(item.fit.score)}</b></span>
        <span>역량<b className="ml-1 font-bold text-foreground">{Math.round(item.quality.score)}</b></span>
        <span>진정성<b className="ml-1 font-bold text-foreground">{Math.round(item.auth.score)}</b></span>
      </div>
      {onManage && (
        <span
          role="link"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onManage(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onManage(); } }}
          className="mt-0.5 w-fit text-[11px] font-medium text-muted-foreground underline hover:text-foreground"
        >
          캠페인에서 진행 관리 →
        </span>
      )}
    </button>
  );
}
function ListBadge({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px]", dark ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
      {label}
    </span>
  );
}

function FilterChips({ filters, setFilters }: { filters: DashboardFilters; setFilters: (f: DashboardFilters) => void }) {
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.creatorType !== "상관없음")
    chips.push({ key: "type", label: filters.creatorType, clear: () => setFilters({ ...filters, creatorType: "상관없음" }) });
  if (filters.gender !== "상관없음")
    chips.push({ key: "gender", label: filters.gender, clear: () => setFilters({ ...filters, gender: "상관없음" }) });
  if (!filters.countries.includes("상관없음"))
    for (const c of filters.countries)
      chips.push({
        key: "c-" + c,
        label: c,
        clear: () => { const next = filters.countries.filter((x) => x !== c); setFilters({ ...filters, countries: next.length ? next : ["상관없음"] }); },
      });
  if (chips.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <button key={c.key} type="button" onClick={c.clear} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent">
          {c.label}<X className="size-3" />
        </button>
      ))}
    </div>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const { filters, setFilters, decisions, setDecision } = useDashboard();
  const scored = useMemo(() => scoreAll(), []);
  const { visible, excluded } = useMemo(() => {
    const visible: ScoredProposal[] = [];
    const excluded: ScoredProposal[] = [];
    for (const s of scored) (passesFilters(s.proposal, filters) ? visible : excluded).push(s);
    return { visible, excluded };
  }, [scored, filters]);

  // 응답 상태별 그룹 (받은 제안 = 무응답).
  const grouped = useMemo(() => {
    const g: Record<TabKey, ScoredProposal[]> = { received: [], 협의: [], 수락: [], 거절: [] };
    for (const s of visible) {
      const d = decisions[s.proposal.id]?.decision;
      if (!d) g.received.push(s);
      else g[d].push(s);
    }
    return g;
  }, [visible, decisions]);

  const [tab, setTab] = useState<TabKey>("received");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);

  // Deep link from a campaign creator: /demo/inbox?select=<id>.
  useEffect(() => {
    const sel = new URLSearchParams(window.location.search).get("select");
    if (sel) { setSelectedId(sel); setMobileDetail(true); }
  }, []);

  // ESC closes the detail (desktop).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const tabItems = grouped[tab];
  const selected = [...visible, ...excluded].find((s) => s.proposal.id === selectedId) ?? null;
  const selIsExcluded = !!selectedId && excluded.some((e) => e.proposal.id === selectedId);
  const selDecision = selectedId ? decisions[selectedId]?.decision : undefined;
  const selOrigin = selectedId ? originCampaignId(selectedId) : null;

  const banner = (selIsExcluded || (selDecision === "수락" && selOrigin)) ? (
    <div className="mb-4 space-y-2">
      {selIsExcluded && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
          브랜드 필터(카테고리/유형 등)와 맞지 않아 기본 제외된 제안이에요. 마음이 바뀌면 바로 응답할 수 있어요.
        </div>
      )}
      {selDecision === "수락" && selOrigin && (
        <button
          type="button"
          onClick={() => router.push(`/demo/campaigns/${selOrigin}`)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-medium hover:bg-foreground/[0.03]"
        >
          캠페인에서 진행 관리 <span aria-hidden>→</span>
        </button>
      )}
    </div>
  ) : undefined;

  return (
    <div className="flex h-full">
      {/* List pane */}
      <section className={cn("flex w-full flex-col border-r border-border md:w-[380px] md:flex-none", mobileDetail && "hidden md:flex")}>
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-base font-bold">역제안 인박스</h1>
          <div className="mt-3 flex flex-wrap gap-1">
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
          <div className="mt-2 text-xs text-muted-foreground">종합점수 순 · {tabItems.length}건</div>
          <FilterChips filters={filters} setFilters={setFilters} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tabItems.map((item) => {
            const rec = decisions[item.proposal.id];
            const canManage = rec?.decision === "수락" && !!originCampaignId(item.proposal.id);
            return (
              <ListRow
                key={item.proposal.id}
                item={item}
                selected={item.proposal.id === selectedId}
                badge={decisionBadge(rec, item.proposal.status)}
                onClick={() => { setSelectedId(item.proposal.id); setMobileDetail(true); }}
                onManage={canManage ? () => router.push(`/demo/campaigns/${originCampaignId(item.proposal.id)}`) : undefined}
              />
            );
          })}
          {tabItems.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">이 탭에 제안이 없어요.</p>
          )}

          {tab === "received" && excluded.length > 0 && (
            <div className="px-4 py-3">
              <button type="button" onClick={() => setShowExcluded((v) => !v)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronDown className={cn("size-3.5 transition-transform", showExcluded && "rotate-180")} />
                조건 불일치로 제외 {excluded.length}건
              </button>
              {showExcluded && (
                <div className="mt-2 space-y-1.5">
                  {excluded.map((s) => (
                    <button
                      key={s.proposal.id}
                      type="button"
                      onClick={() => { setSelectedId(s.proposal.id); setMobileDetail(true); }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[11px] transition-colors",
                        s.proposal.id === selectedId ? "bg-muted" : "opacity-70 hover:opacity-100 hover:bg-foreground/[0.03]",
                      )}
                    >
                      <span className="min-w-0 truncate text-muted-foreground">{s.proposal.profile_name} · {s.proposal.selected_categories[0]}</span>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{exclusionReason(s.proposal, filters)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Detail pane */}
      <div className={cn("min-w-0 flex-1", !mobileDetail && "hidden md:block")}>
        {selected ? (
          <ProposalDetail
            key={selected.proposal.id}
            item={selected}
            record={decisions[selected.proposal.id] ?? null}
            onDecision={(r) => setDecision(selected.proposal.id, r)}
            onBack={() => setMobileDetail(false)}
            onClose={() => setSelectedId(null)}
            banner={banner}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Inbox className="size-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {tabItems.length === 0 ? "이 탭에 제안이 없어요" : "제안을 선택하면 상세 내용이 표시됩니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
