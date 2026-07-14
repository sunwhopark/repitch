"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, Sparkles, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { DashboardFilters } from "@/components/dashboard/filter-modal";
import { scoreProposal, type ScoredProposal } from "@/lib/scoring";
import { scoreAll } from "@/lib/scoring";
import { SEED_PROPOSALS, type SeedProposal } from "@/components/dashboard/seed-proposals";
import { ProposalDetail, PlatformIcon, fmt } from "@/components/dashboard/proposal-detail";
import { InfluencerSummary } from "@/components/dashboard/influencer-summary";
import { SEED_INFLUENCERS, type Influencer } from "@/components/dashboard/seed-influencers";
import { CreateCampaignModal } from "@/components/ui/create-campaign-modal";
import type { Campaign, CampaignForm } from "@/components/dashboard/seed-campaigns";
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { BRAND_AGE_GROUPS } from "@/lib/brand-application-options";

type SortKey = "followers" | "avg_views" | "engagement";
const CATEGORIES = [...new Set(SEED_INFLUENCERS.map((i) => i.category))];
const SPEC_SIZES = ["1천 이하", "1천~1만", "1만~10만", "10만 이상", "상관없음"];
const SPEC_GENDERS = ["여성", "남성", "무관"];
const MATCH_MIN = 40;

// ── 매칭 점수 = scoring 엔진의 Fit 축 재사용(로직 변경 없음). 오디언스 데이터가
// 있는 인박스 시드 인물은 A2(타겟 겹침)까지 반영되고, 없는 인물은 엔진의 미수집
// 규칙대로 A2 제외 후 환산된다. 규칙 기반 v1 — "AI 추천"이 아니라 매칭 점수.
function synthProposal(inf: Influencer): SeedProposal {
  return {
    id: `synth-${inf.id}`, status: "신규", brand_name: "데모 브랜드", product_name: inf.category,
    platform: inf.platform, profile_name: inf.profile_name, profile_url: inf.profile_url, profile_count: inf.followers,
    selected_categories: [inf.category], peak_views: Math.max(1, inf.avg_views), collab_count: `${inf.collabs}회`,
    story_text: "", content_types: [], content_tone: "정보",
    expected_price: Math.max(1, Math.round((2.5 * inf.avg_views) / 10000)), reuse_allowed: true,
    upload_date: "", created_at: "2026-07-01T00:00:00Z", creator_type: inf.creator_type, creator_gender: inf.gender,
    audience_country: [inf.region], trial_received_at: "2026-06-01T00:00:00Z",
    b4: { rating: 3, comment: "" }, c2: { level: 3, score: 18, evidence: [] },
    c3: { level: 3, score: 15, evidence: [], ad_speak_flags: [] }, c4: { level: 3, score: 9, evidence: [] },
  };
}
function matchFit(inf: Influencer): number {
  const real = inf.proposalId ? SEED_PROPOSALS.find((p) => p.id === inf.proposalId) : undefined;
  return Math.round(scoreProposal(real ?? synthProposal(inf)).fit.score);
}

function passesHard(inf: Influencer, f: DashboardFilters) {
  if (f.creatorType !== "상관없음" && inf.creator_type !== f.creatorType) return false;
  if (f.gender !== "상관없음" && inf.gender !== f.gender) return false;
  if (!f.countries.includes("상관없음") && !f.countries.includes(inf.region)) return false;
  return true;
}
// 팔로워 슬라이더 — 로그 스케일(1천~15만). pos 0~100.
const posToF = (pos: number) => (pos <= 0 ? 0 : Math.round(1000 * Math.pow(150, pos / 100)));

type MatchSpec = { category: string; ages: string[]; gender: string; platforms: ("instagram" | "youtube")[]; sizeRanges: string[] };
function specFromCampaign(c: Campaign): MatchSpec {
  const f = c.form;
  return {
    category: f?.category ?? "뷰티",
    ages: f?.ages ?? [],
    gender: f?.gender ?? "",
    platforms: (f?.platforms ?? []).filter((p): p is "instagram" | "youtube" => p === "instagram" || p === "youtube") as ("instagram" | "youtube")[],
    sizeRanges: f?.sizeRanges ?? [],
  };
}
function specToPrefill(spec: MatchSpec): Partial<CampaignForm> {
  return {
    category: spec.category, ages: spec.ages, gender: spec.gender,
    platforms: spec.platforms.map((p) => (p === "instagram" ? "Instagram" : "YouTube")),
    sizeRanges: spec.sizeRanges,
  };
}

function Star2({ on, onClick }: { on: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button type="button" aria-label={on ? "관심 해제" : "관심 표시"} onClick={onClick} className="grid size-7 place-items-center rounded-md text-muted-foreground/50 transition-colors hover:text-foreground">
      <Star className={cn("size-4", on && "fill-foreground text-foreground")} />
    </button>
  );
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}
function SortHeader({ label, k, sortKey, sortDir, onClick, disabled }: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: "asc" | "desc"; onClick: (k: SortKey) => void; disabled?: boolean;
}) {
  const active = sortKey === k && !disabled;
  return (
    <th className="py-2.5 pr-3 text-right font-medium">
      <button type="button" disabled={disabled} onClick={() => onClick(k)} className={cn("ml-auto flex items-center gap-0.5 hover:text-foreground disabled:cursor-default disabled:hover:text-current", active && "text-foreground")}>
        {label}
        {!disabled && <ChevronDown className={cn("size-3 transition-transform", active ? "opacity-100" : "opacity-30", active && sortDir === "asc" && "rotate-180")} />}
      </button>
    </th>
  );
}

// 듀얼 핸들 팔로워 슬라이더.
function FollowerSlider({ minPos, maxPos, onChange }: { minPos: number; maxPos: number; onChange: (mn: number, mx: number) => void }) {
  const set = (which: "min" | "max", v: number) => {
    if (which === "min") onChange(Math.min(v, maxPos), maxPos);
    else onChange(minPos, Math.max(v, minPos));
  };
  const label = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}만` : n.toLocaleString());
  return (
    <div className="w-56">
      <div className="mb-1.5 text-xs font-medium tabular-nums">
        {label(posToF(minPos))} ~ {maxPos >= 100 ? "15만+" : label(posToF(maxPos))}
      </div>
      <div className="relative h-4">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground" style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }} />
        <input type="range" min={0} max={100} value={minPos} onChange={(e) => set("min", +e.target.value)} className="range-dual absolute inset-0 h-4 w-full" aria-label="최소 팔로워" />
        <input type="range" min={0} max={100} value={maxPos} onChange={(e) => set("max", +e.target.value)} className="range-dual absolute inset-0 h-4 w-full" aria-label="최대 팔로워" />
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

// ── 매칭 진입 모달 ──────────────────────────────────────────────────
function MatchModal({ open, onOpenChange, campaigns, onPickCampaign, onPickSpec }: {
  open: boolean; onOpenChange: (o: boolean) => void; campaigns: Campaign[];
  onPickCampaign: (c: Campaign) => void; onPickSpec: (spec: MatchSpec) => void;
}) {
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [cat, setCat] = useState("");
  const [ages, setAges] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [pfs, setPfs] = useState<("instagram" | "youtube")[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  useEffect(() => { if (open) { setTab("existing"); setCat(""); setAges([]); setGender(""); setPfs([]); setSizes([]); } }, [open]);
  const toggle = <T,>(arr: T[], set: (v: T[]) => void, v: T) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg md:rounded-2xl md:border-0 md:shadow-xl">
        <ModalHeader className="gap-3 border-b-0 bg-transparent pr-10 text-left">
          <ModalTitle className="text-xl font-semibold">캠페인에 맞는 인플루언서 찾기</ModalTitle>
          <div className="flex gap-1 rounded-full border border-border p-0.5">
            <button type="button" onClick={() => setTab("existing")} className={cn("flex-1 rounded-full px-3 py-1.5 text-sm font-medium", tab === "existing" ? "bg-foreground text-background" : "text-muted-foreground")}>기존 캠페인</button>
            <button type="button" onClick={() => setTab("new")} className={cn("flex-1 rounded-full px-3 py-1.5 text-sm font-medium", tab === "new" ? "bg-foreground text-background" : "text-muted-foreground")}>새 조건으로 찾기</button>
          </div>
        </ModalHeader>
        <ModalBody className="max-h-[60vh] overflow-y-auto px-4 pb-6 md:px-6">
          {tab === "existing" ? (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <button key={c.id} type="button" onClick={() => onPickCampaign(c)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-foreground/[0.03]">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.product}</div>
                    <div className="text-xs text-muted-foreground">{c.period} · {c.status}</div>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">→</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <FilterGroupBlock label="카테고리 *"><div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}</div></FilterGroupBlock>
              <FilterGroupBlock label="타겟 연령"><div className="flex flex-wrap gap-2">{BRAND_AGE_GROUPS.map((a) => <Chip key={a} active={ages.includes(a)} onClick={() => toggle(ages, setAges, a)}>{a}</Chip>)}</div></FilterGroupBlock>
              <FilterGroupBlock label="성별"><div className="flex flex-wrap gap-2">{SPEC_GENDERS.map((g) => <Chip key={g} active={gender === g} onClick={() => setGender(g)}>{g}</Chip>)}</div></FilterGroupBlock>
              <FilterGroupBlock label="플랫폼"><div className="flex flex-wrap gap-2">{(["instagram", "youtube"] as const).map((p) => <Chip key={p} active={pfs.includes(p)} onClick={() => toggle(pfs, setPfs, p)}>{p === "instagram" ? "Instagram" : "YouTube"}</Chip>)}</div></FilterGroupBlock>
              <FilterGroupBlock label="희망 규모"><div className="flex flex-wrap gap-2">{SPEC_SIZES.map((s) => <Chip key={s} active={sizes.includes(s)} onClick={() => toggle(sizes, setSizes, s)}>{s}</Chip>)}</div></FilterGroupBlock>
              <button type="button" disabled={!cat} onClick={() => onPickSpec({ category: cat, ages, gender, platforms: pfs, sizeRanges: sizes })} className="h-11 w-full rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground">
                이 조건으로 찾기
              </button>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
function FilterGroupBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="text-[13px] font-medium">{label}</span>
      {children}
    </div>
  );
}

export default function InfluencersPage() {
  const { filters, favorites, toggleFavorite, decisions, setDecision, campaigns, addCampaign } = useDashboard();
  const scored = useMemo(() => scoreAll(), []);
  const matchScores = useMemo(() => Object.fromEntries(SEED_INFLUENCERS.map((i) => [i.id, matchFit(i)])), []);

  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<("instagram" | "youtube")[]>([]);
  const [genderF, setGenderF] = useState<"전체" | "여성" | "남성">("전체");
  const [minPos, setMinPos] = useState(0);
  const [maxPos, setMaxPos] = useState(100);
  const [favOnly, setFavOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showExcluded, setShowExcluded] = useState(false);
  const [showLow, setShowLow] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);

  const [match, setMatch] = useState<{ label: string; fromNew: boolean; spec: MatchSpec } | null>(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<Partial<CampaignForm> | null>(null);

  const toggle = <T,>(arr: T[], set: (v: T[]) => void, v: T) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clickSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  // 매칭 모드는 전체(하드필터 통과) 인플루언서를 매칭 점수순으로 세운다(미만은
  // 접힘). 스펙은 라벨·프리필 용도 — 바 필터는 사용자가 계속 제어(동시 적용).
  const enterFromCampaign = (c: Campaign) => { setMatch({ label: c.product, fromNew: false, spec: specFromCampaign(c) }); setMatchOpen(false); };
  const enterFromSpec = (spec: MatchSpec) => { setMatch({ label: "새 조건", fromNew: true, spec }); setMatchOpen(false); };

  const inRange = (f: number) => f >= posToF(minPos) && (maxPos >= 100 || f <= posToF(maxPos));
  const soft = (i: Influencer) =>
    (!q || i.profile_name.toLowerCase().includes(q.toLowerCase())) &&
    (!cats.length || cats.includes(i.category)) &&
    (!platforms.length || platforms.includes(i.platform)) &&
    (genderF === "전체" || i.gender === genderF) &&
    inRange(i.followers) &&
    (!favOnly || favorites.includes(i.id));

  const excluded = SEED_INFLUENCERS.filter((i) => !passesHard(i, filters));
  const passing = SEED_INFLUENCERS.filter((i) => passesHard(i, filters) && soft(i));

  const { high, low } = useMemo(() => {
    if (match) {
      const sorted = [...passing].sort((a, b) => matchScores[b.id] - matchScores[a.id]);
      return { high: sorted.filter((i) => matchScores[i.id] >= MATCH_MIN), low: sorted.filter((i) => matchScores[i.id] < MATCH_MIN) };
    }
    const sorted = [...passing].sort((a, b) => (sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]));
    return { high: sorted, low: [] as Influencer[] };
  }, [passing, match, matchScores, sortKey, sortDir]);

  useEffect(() => {
    if (selectedId && ![...passing, ...excluded].some((i) => i.id === selectedId)) { setSelectedId(null); setShowProposal(false); }
  }, [passing, excluded, selectedId]);
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (showProposal) setShowProposal(false); else setSelectedId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, showProposal]);

  const selectedInf = selectedId ? SEED_INFLUENCERS.find((i) => i.id === selectedId) ?? null : null;
  const proposalItem: ScoredProposal | null = selectedInf?.proposalId ? scored.find((s) => s.proposal.id === selectedInf.proposalId) ?? null : null;
  const openInf = (i: Influencer) => { setSelectedId(i.id); setShowProposal(false); setMobileDetail(true); };

  const Row = ({ i }: { i: Influencer }) => (
    <tr onClick={() => openInf(i)} className={cn("cursor-pointer border-b border-border last:border-0 transition-colors", i.id === selectedId ? "bg-muted" : "hover:bg-foreground/[0.03]")}>
      <td className="py-2.5 pl-4"><Star2 on={favorites.includes(i.id)} onClick={(e) => { e.stopPropagation(); toggleFavorite(i.id); }} /></td>
      {match && <td className="py-2.5 pr-3 text-right"><span className="text-lg font-extrabold tabular-nums">{matchScores[i.id]}</span></td>}
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">{i.profile_name.charAt(0).toUpperCase()}</span>
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
  );
  const colCount = match ? 8 : 7;

  return (
    <div className="flex h-full">
      <div className={cn("min-w-0 flex-1 overflow-y-auto p-6 md:p-8", mobileDetail && "hidden md:block")}>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">인플루언서 DB</h1>
        <p className="mt-1 text-sm text-muted-foreground">서비스에 등록된 크리에이터를 탐색해요.</p>

        {/* 매칭 진입 / 컨텍스트 배너 */}
        {match ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-foreground/20 bg-foreground/[0.04] px-4 py-3">
            <Sparkles className="size-4 shrink-0" />
            <span className="text-sm font-semibold">‘{match.label}’에 맞는 인플루언서 · 매칭 점수순</span>
            {match.fromNew && (
              <button type="button" onClick={() => setCreatePrefill(specToPrefill(match.spec))} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-foreground/[0.03]">
                이 조건으로 캠페인 만들기
              </button>
            )}
            <button type="button" onClick={() => setMatch(null)} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              매칭 해제 <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setMatchOpen(true)} className="mt-5 flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-foreground/[0.03]">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground text-background"><Sparkles className="size-4" /></span>
            <div className="min-w-0">
              <div className="text-sm font-bold">어떤 캠페인에 맞는 인플루언서를 찾으세요?</div>
              <div className="text-xs text-muted-foreground">캠페인 선택 또는 새 조건으로 매칭 점수순 탐색</div>
            </div>
            <span className="ml-auto shrink-0 text-sm text-muted-foreground">→</span>
          </button>
        )}

        {/* 필터바 (그룹) */}
        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 검색" className="h-9 w-44 rounded-full border border-border bg-transparent pl-9 pr-3 text-sm outline-none focus:border-foreground/40" />
          </div>
          <FilterGroup label="성별">
            {(["전체", "여성", "남성"] as const).map((g) => <Chip key={g} active={genderF === g} onClick={() => setGenderF(g)}>{g}</Chip>)}
          </FilterGroup>
          <FilterGroup label="SNS">
            {(["instagram", "youtube"] as const).map((p) => <Chip key={p} active={platforms.includes(p)} onClick={() => toggle(platforms, setPlatforms, p)}>{p === "instagram" ? "Instagram" : "YouTube"}</Chip>)}
          </FilterGroup>
          <FilterGroup label="팔로워 수"><FollowerSlider minPos={minPos} maxPos={maxPos} onChange={(mn, mx) => { setMinPos(mn); setMaxPos(mx); }} /></FilterGroup>
          <button type="button" onClick={() => setFavOnly((v) => !v)} className={cn("flex items-center gap-1.5 self-end rounded-full border px-3 py-1.5 text-sm transition-colors", favOnly ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")}>
            <Star className={cn("size-3.5", favOnly && "fill-background")} /> 관심만
          </button>
          <FilterGroup label="콘텐츠">
            {CATEGORIES.map((c) => <Chip key={c} active={cats.includes(c)} onClick={() => toggle(cats, setCats, c)}>{c}</Chip>)}
          </FilterGroup>
        </div>

        {/* 테이블 */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="w-10 py-2.5 pl-4" />
                {match && <th className="py-2.5 pr-3 text-right font-medium">매칭</th>}
                <th className="py-2.5 pr-3 font-medium">프로필</th>
                <th className="py-2.5 pr-3 font-medium">카테고리</th>
                <SortHeader label="팔로워" k="followers" sortKey={sortKey} sortDir={sortDir} onClick={clickSort} disabled={!!match} />
                <SortHeader label="평균 조회수" k="avg_views" sortKey={sortKey} sortDir={sortDir} onClick={clickSort} disabled={!!match} />
                <SortHeader label="참여율" k="engagement" sortKey={sortKey} sortDir={sortDir} onClick={clickSort} disabled={!!match} />
                <th className="py-2.5 pr-4 text-right font-medium">협업</th>
              </tr>
            </thead>
            <tbody>
              {high.map((i) => <Row key={i.id} i={i} />)}
              {high.length === 0 && <tr><td colSpan={colCount} className="px-4 py-10 text-center text-sm text-muted-foreground">조건에 맞는 인플루언서가 없어요.</td></tr>}
              {match && low.length > 0 && (
                <>
                  <tr><td colSpan={colCount} className="border-t border-border bg-muted/30 px-4 py-2">
                    <button type="button" onClick={() => setShowLow((v) => !v)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <ChevronDown className={cn("size-3.5 transition-transform", showLow && "rotate-180")} /> 적합도 낮음 {low.length}명
                    </button>
                  </td></tr>
                  {showLow && low.map((i) => <Row key={i.id} i={i} />)}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 하드 필터 제외 */}
        {excluded.length > 0 && (
          <div className="mt-3">
            <button type="button" onClick={() => setShowExcluded((v) => !v)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className={cn("size-3.5 transition-transform", showExcluded && "rotate-180")} /> 필터로 제외 {excluded.length}명
            </button>
            {showExcluded && (
              <div className="mt-2 flex flex-wrap gap-1.5 opacity-60">
                {excluded.map((i) => (
                  <span key={i.id} className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">{i.profile_name} · {i.creator_type} · {i.gender} · {i.region}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 우측 패널 */}
      {selectedInf && (
        <div className={cn("min-w-0 flex-1 md:w-[440px] md:flex-none md:border-l md:border-border", !mobileDetail && "hidden md:block")}>
          {showProposal && proposalItem ? (
            <ProposalDetail key={proposalItem.proposal.id} item={proposalItem} record={decisions[proposalItem.proposal.id] ?? null} onDecision={(r) => setDecision(proposalItem.proposal.id, r)} onBack={() => setShowProposal(false)} onClose={() => setShowProposal(false)} />
          ) : (
            <InfluencerSummary
              key={selectedInf.id}
              inf={selectedInf}
              matchScore={match ? matchScores[selectedInf.id] : undefined}
              onBack={() => setMobileDetail(false)}
              onClose={() => setSelectedId(null)}
              footer={proposalItem ? (
                <button type="button" onClick={() => setShowProposal(true)} className="h-11 w-full rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90">이 크리에이터의 역제안 보기</button>
              ) : undefined}
            />
          )}
        </div>
      )}

      <MatchModal open={matchOpen} onOpenChange={setMatchOpen} campaigns={campaigns} onPickCampaign={enterFromCampaign} onPickSpec={enterFromSpec} />
      <CreateCampaignModal open={!!createPrefill} onOpenChange={(o) => { if (!o) setCreatePrefill(null); }} prefill={createPrefill ?? undefined} onSubmit={(c) => { addCampaign(c); setCreatePrefill(null); }} />
    </div>
  );
}
