"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Inbox, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { DashboardFilters } from "@/components/dashboard/filter-modal";
import { scoreAll, passesFilters, exclusionReason, type ScoredProposal } from "@/lib/scoring";
import {
  ProposalDetail,
  PlatformIcon,
  fmt,
} from "@/components/dashboard/proposal-detail";

const shortLabel = (l: string) => l.replace(" (점수에서 제외)", "");

// ── List row ────────────────────────────────────────────────────────
function ListRow({
  item,
  selected,
  badge,
  onClick,
}: {
  item: ScoredProposal;
  selected: boolean;
  badge: string;
  onClick: () => void;
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
        <span className="ml-auto text-lg font-extrabold tabular-nums tracking-tight">
          {Math.round(item.composite)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          {p.product_name} · {p.expected_price}만원
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <ListBadge label={badge} dark />
        {item.labels.map((l) => (
          <ListBadge key={l} label={shortLabel(l)} />
        ))}
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span>적합도<b className="ml-1 font-bold text-foreground">{Math.round(item.fit.score)}</b></span>
        <span>역량<b className="ml-1 font-bold text-foreground">{Math.round(item.quality.score)}</b></span>
        <span>진정성<b className="ml-1 font-bold text-foreground">{Math.round(item.auth.score)}</b></span>
      </div>
    </button>
  );
}
function ListBadge({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px]",
        dark ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}


function FilterChips({
  filters,
  setFilters,
}: {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
}) {
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
        clear: () => {
          const next = filters.countries.filter((x) => x !== c);
          setFilters({ ...filters, countries: next.length ? next : ["상관없음"] });
        },
      });
  if (chips.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.clear}
          className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent"
        >
          {c.label}
          <X className="size-3" />
        </button>
      ))}
    </div>
  );
}

export default function InboxPage() {
  const { filters, setFilters, decisions, setDecision } = useDashboard();
  const scored = useMemo(() => scoreAll(), []);
  const { visible, excluded } = useMemo(() => {
    const visible: ScoredProposal[] = [];
    const excluded: ScoredProposal[] = [];
    for (const s of scored) (passesFilters(s.proposal, filters) ? visible : excluded).push(s);
    return { visible, excluded };
  }, [scored, filters]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);

  // Deep link from a campaign creator ("역제안 도착"): /dashboard/inbox?select=<id>.
  useEffect(() => {
    const sel = new URLSearchParams(window.location.search).get("select");
    if (sel) {
      setSelectedId(sel);
      setMobileDetail(true);
    }
  }, []);

  // No auto-select. Only clear a selection that got filtered out.
  useEffect(() => {
    if (selectedId && !visible.some((v) => v.proposal.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visible, selectedId]);

  // ESC closes the detail (desktop).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const selected = visible.find((v) => v.proposal.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      {/* List pane */}
      <section
        className={cn(
          "flex w-full flex-col border-r border-border md:w-[380px] md:flex-none",
          mobileDetail && "hidden md:flex",
        )}
      >
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-base font-bold">역제안 인박스</h1>
          <div className="mt-1 text-xs text-muted-foreground">종합점수 순 · {visible.length}건</div>
          <FilterChips filters={filters} setFilters={setFilters} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {visible.map((item) => (
            <ListRow
              key={item.proposal.id}
              item={item}
              selected={item.proposal.id === selectedId}
              badge={decisions[item.proposal.id] ?? item.proposal.status}
              onClick={() => {
                setSelectedId(item.proposal.id);
                setMobileDetail(true);
              }}
            />
          ))}

          {excluded.length > 0 && (
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => setShowExcluded((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={cn("size-3.5 transition-transform", showExcluded && "rotate-180")} />
                조건 불일치로 제외 {excluded.length}건
              </button>
              {showExcluded && (
                <div className="mt-2 space-y-1.5 opacity-60">
                  {excluded.map((s) => (
                    <div
                      key={s.proposal.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[11px] text-muted-foreground"
                    >
                      <span className="min-w-0 truncate">
                        {s.proposal.profile_name} · {s.proposal.selected_categories[0]}
                      </span>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5">
                        {exclusionReason(s.proposal, filters)}
                      </span>
                    </div>
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
            decision={decisions[selected.proposal.id] ?? null}
            onDecision={(d) => setDecision(selected.proposal.id, d)}
            onBack={() => setMobileDetail(false)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <Inbox className="size-8 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {visible.length === 0
                ? "조건에 맞는 제안이 없어요"
                : "제안을 선택하면 상세 내용이 표시됩니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
