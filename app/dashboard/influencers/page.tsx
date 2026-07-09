"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Search, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { DashboardFilters } from "@/components/dashboard/filter-modal";
import { scoreAll, type ScoredProposal } from "@/lib/scoring";
import { ProposalDetail, PlatformIcon, fmt } from "@/components/dashboard/proposal-detail";
import { SEED_INFLUENCERS, type Influencer } from "@/components/dashboard/seed-influencers";

type SortKey = "followers" | "avg_views" | "engagement";
type Band = "all" | "lt1" | "1to5" | "gt5";

const CATEGORIES = [...new Set(SEED_INFLUENCERS.map((i) => i.category))];
const BANDS: { key: Band; label: string }[] = [
  { key: "lt1", label: "~1만" },
  { key: "1to5", label: "1~5만" },
  { key: "gt5", label: "5만~" },
];

function passesHard(inf: Influencer, f: DashboardFilters) {
  if (f.creatorType !== "상관없음" && inf.creator_type !== f.creatorType) return false;
  if (f.gender !== "상관없음" && inf.gender !== f.gender) return false;
  if (!f.countries.includes("상관없음") && !f.countries.includes(inf.region)) return false;
  return true;
}
const inBand = (n: number, b: Band) =>
  b === "all" || (b === "lt1" ? n < 10000 : b === "1to5" ? n >= 10000 && n < 50000 : n >= 50000);

function Star2({ on, onClick }: { on: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      aria-label={on ? "관심 해제" : "관심 표시"}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md text-muted-foreground/50 transition-colors hover:text-foreground"
    >
      <Star className={cn("size-4", on && "fill-foreground text-foreground")} />
    </button>
  );
}

// ── Right panel: influencer summary ─────────────────────────────────
function InfluencerSummary({
  inf,
  hasProposal,
  onSeeProposal,
  onBack,
  onClose,
}: {
  inf: Influencer;
  hasProposal: boolean;
  onSeeProposal: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const metrics: [string, string][] = [
    ["팔로워", fmt(inf.followers)],
    ["평균 조회수", fmt(inf.avg_views)],
    ["참여율", `${inf.engagement}%`],
    ["협업 수", `${inf.collabs}회`],
  ];
  const info: [string, string][] = [
    ["카테고리", inf.category],
    ["유형", inf.creator_type],
    ["성별", inf.gender],
    ["활동 지역", inf.region],
  ];
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 px-6 py-6 md:px-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
        >
          <ChevronRight className="size-4 rotate-180" /> 목록
        </button>

        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-base font-bold">
            {inf.profile_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <a
              href={inf.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-lg font-bold hover:underline"
            >
              <span className="truncate">{inf.profile_name}</span>
              <PlatformIcon platform={inf.platform} className="size-4 shrink-0 text-foreground/70" />
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </a>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {inf.category} · {inf.creator_type} · {inf.gender} · {inf.region}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="ml-auto hidden size-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:grid"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Core metrics */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border">
          {metrics.map(([l, v]) => (
            <div key={l} className="p-4">
              <div className="text-[11px] text-muted-foreground">{l}</div>
              <div className="mt-1 text-xl font-extrabold tabular-nums">{v}</div>
            </div>
          ))}
        </div>

        {/* Activity info */}
        <div className="mt-5">
          {info.map(([l, v]) => (
            <div key={l} className="flex items-center justify-between gap-3 border-b border-dashed border-border py-1.5 text-[13px]">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-foreground/80">{inf.bio}</p>
      </div>

      {hasProposal && (
        <div className="sticky bottom-0 border-t border-border bg-background px-6 py-3 md:px-8">
          <button
            type="button"
            onClick={onSeeProposal}
            className="h-11 w-full rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
          >
            이 크리에이터의 역제안 보기
          </button>
        </div>
      )}
    </div>
  );
}

export default function InfluencersPage() {
  const { filters, favorites, toggleFavorite, decisions, setDecision } = useDashboard();
  const scored = useMemo(() => scoreAll(), []);

  // filter/sort state
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<("instagram" | "youtube")[]>([]);
  const [band, setBand] = useState<Band>("all");
  const [favOnly, setFavOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showExcluded, setShowExcluded] = useState(false);

  // selection / panel state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);

  const toggle = <T,>(arr: T[], set: (v: T[]) => void, v: T) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const clickSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const { visible, excluded } = useMemo(() => {
    const hard = SEED_INFLUENCERS.filter((i) => passesHard(i, filters));
    const excluded = SEED_INFLUENCERS.filter((i) => !passesHard(i, filters));
    const soft = hard.filter((i) => {
      if (q && !i.profile_name.toLowerCase().includes(q.toLowerCase())) return false;
      if (cats.length && !cats.includes(i.category)) return false;
      if (platforms.length && !platforms.includes(i.platform)) return false;
      if (!inBand(i.followers, band)) return false;
      if (favOnly && !favorites.includes(i.id)) return false;
      return true;
    });
    const visible = [...soft].sort((a, b) =>
      sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey],
    );
    return { visible, excluded };
  }, [filters, q, cats, platforms, band, favOnly, favorites, sortKey, sortDir]);

  // clear a selection that got filtered out
  useEffect(() => {
    if (selectedId && !visible.some((v) => v.id === selectedId)) {
      setSelectedId(null);
      setShowProposal(false);
    }
  }, [visible, selectedId]);

  // ESC closes the panel (desktop)
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showProposal) setShowProposal(false);
      else setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, showProposal]);

  const selectedInf = selectedId ? SEED_INFLUENCERS.find((i) => i.id === selectedId) ?? null : null;
  const proposalItem: ScoredProposal | null =
    selectedInf?.proposalId ? scored.find((s) => s.proposal.id === selectedInf.proposalId) ?? null : null;

  const openInf = (i: Influencer) => {
    setSelectedId(i.id);
    setShowProposal(false);
    setMobileDetail(true);
  };

  return (
    <div className="flex h-full">
      <div className={cn("min-w-0 flex-1 overflow-y-auto p-6 md:p-8", mobileDetail && "hidden md:block")}>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">인플루언서 DB</h1>
        <p className="mt-1 text-sm text-muted-foreground">서비스에 등록된 크리에이터를 탐색해요.</p>

        {/* Filter bar */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름 검색"
                className="h-9 w-52 rounded-full border border-border bg-transparent pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
              />
            </div>
            {(["instagram", "youtube"] as const).map((p) => (
              <Chip key={p} active={platforms.includes(p)} onClick={() => toggle(platforms, setPlatforms, p)}>
                {p === "instagram" ? "Instagram" : "YouTube"}
              </Chip>
            ))}
            {BANDS.map((b) => (
              <Chip key={b.key} active={band === b.key} onClick={() => setBand(band === b.key ? "all" : b.key)}>
                {b.label}
              </Chip>
            ))}
            <button
              type="button"
              onClick={() => setFavOnly((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                favOnly ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Star className={cn("size-3.5", favOnly && "fill-background")} /> 관심만
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip key={cat} active={cats.includes(cat)} onClick={() => toggle(cats, setCats, cat)}>
                {cat}
              </Chip>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="w-10 py-2.5 pl-4" />
                <th className="py-2.5 pr-3 font-medium">프로필</th>
                <th className="py-2.5 pr-3 font-medium">카테고리</th>
                <SortHeader label="팔로워" k="followers" sortKey={sortKey} sortDir={sortDir} onClick={clickSort} />
                <SortHeader label="평균 조회수" k="avg_views" sortKey={sortKey} sortDir={sortDir} onClick={clickSort} />
                <SortHeader label="참여율" k="engagement" sortKey={sortKey} sortDir={sortDir} onClick={clickSort} />
                <th className="py-2.5 pr-4 text-right font-medium">협업</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => openInf(i)}
                  className={cn("cursor-pointer border-b border-border last:border-0 transition-colors", i.id === selectedId ? "bg-muted" : "hover:bg-foreground/[0.03]")}
                >
                  <td className="py-2.5 pl-4">
                    <Star2 on={favorites.includes(i.id)} onClick={(e) => { e.stopPropagation(); toggleFavorite(i.id); }} />
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                        {i.profile_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate font-medium">{i.profile_name}</span>
                      <PlatformIcon platform={i.platform} className="size-3.5 shrink-0 text-foreground/60" />
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{i.category}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{fmt(i.followers)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{fmt(i.avg_views)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{i.engagement}%</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{i.collabs}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    조건에 맞는 인플루언서가 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Hard-filter exclusions */}
        {excluded.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowExcluded((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn("size-3.5 transition-transform", showExcluded && "rotate-180")} />
              필터로 제외 {excluded.length}명
            </button>
            {showExcluded && (
              <div className="mt-2 flex flex-wrap gap-1.5 opacity-60">
                {excluded.map((i) => (
                  <span key={i.id} className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">
                    {i.profile_name} · {i.creator_type} · {i.gender} · {i.region}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel — summary, or the shared 역제안 detail */}
      {selectedInf && (
        <div
          className={cn(
            "min-w-0 flex-1 md:w-[440px] md:flex-none md:border-l md:border-border",
            !mobileDetail && "hidden md:block",
          )}
        >
          {showProposal && proposalItem ? (
            <ProposalDetail
              key={proposalItem.proposal.id}
              item={proposalItem}
              decision={decisions[proposalItem.proposal.id] ?? null}
              onDecision={(d) => setDecision(proposalItem.proposal.id, d)}
              onBack={() => setShowProposal(false)}
              onClose={() => setShowProposal(false)}
            />
          ) : (
            <InfluencerSummary
              key={selectedInf.id}
              inf={selectedInf}
              hasProposal={!!proposalItem}
              onSeeProposal={() => setShowProposal(true)}
              onBack={() => setMobileDetail(false)}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SortHeader({ label, k, sortKey, sortDir, onClick }: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="py-2.5 pr-3 text-right font-medium">
      <button
        type="button"
        onClick={() => onClick(k)}
        className={cn("ml-auto flex items-center gap-0.5 hover:text-foreground", active && "text-foreground")}
      >
        {label}
        <ChevronDown className={cn("size-3 transition-transform", active ? "opacity-100" : "opacity-30", active && sortDir === "asc" && "rotate-180")} />
      </button>
    </th>
  );
}
