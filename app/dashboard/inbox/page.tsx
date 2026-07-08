"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { DashboardFilters } from "@/components/dashboard/filter-modal";
import {
  scoreAll,
  passesFilters,
  exclusionReason,
  WEIGHTS,
  type Axis,
  type ScoredProposal,
} from "@/lib/scoring";

type Decision = "거절" | "협의" | "수락";
const REJECT_REASONS = ["카테고리 부적합", "단가 과다", "오디언스 불일치", "진정성 부족", "일정 불가"];

function fmt(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}만` : n.toLocaleString();
}
const shortLabel = (l: string) => l.replace(" (점수에서 제외)", "");

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  return platform === "instagram" ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="4" />
      <path d="M10.5 9.2 15 12l-4.5 2.8V9.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

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

// ── Detail panel ────────────────────────────────────────────────────
function AxisSection({ axis, badge }: { axis: Axis; badge?: string }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold">
        {axis.label}
        {badge && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
        <span className="ml-auto text-xs font-semibold text-muted-foreground">
          {Math.round(axis.score)}/100
        </span>
      </h3>
      {axis.indicators.map((i) => (
        <div
          key={i.key}
          className="flex items-center justify-between gap-3 border-b border-dashed border-border py-1.5 text-[13px]"
        >
          <span className="min-w-0 text-foreground/80">
            {i.label}
            {i.raw && <span className="ml-1.5 text-xs text-muted-foreground">{i.raw}</span>}
            {i.note && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {i.note}
              </span>
            )}
          </span>
          <span className="shrink-0 font-semibold tabular-nums">
            {i.available ? `${i.score}/${i.max}` : "제외"}
          </span>
        </div>
      ))}
    </section>
  );
}

function Detail({
  item,
  decision,
  onDecision,
  onBack,
}: {
  item: ScoredProposal;
  decision: Decision | null;
  onDecision: (d: Decision, reasons?: string[]) => void;
  onBack: () => void;
}) {
  const p = item.proposal;
  const [more, setMore] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const evidence = [...p.c2.evidence, ...p.c3.evidence, ...p.c4.evidence];
  const toggleReason = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 px-6 py-6 md:px-8">
        {/* mobile back */}
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
        >
          <ChevronLeft className="size-4" /> 목록
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-base font-bold">
            {p.profile_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="truncate">{p.profile_name}</span>
              <PlatformIcon platform={p.platform} className="size-4 shrink-0 text-foreground/70" />
            </div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              팔로워 {fmt(p.profile_count)} · {p.product_name} · {p.creator_type} · {p.creator_gender} · 제안 단가{" "}
              <b className="font-semibold text-foreground">{p.expected_price}만원</b>
            </div>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <div className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">
              {Math.round(item.composite)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">종합점수</div>
          </div>
        </div>

        {/* Axis strip */}
        <div className="mt-4 flex overflow-hidden rounded-xl border border-border">
          {[
            ["적합도", item.fit.score],
            ["크리에이터 역량", item.quality.score],
            ["진정성", item.auth.score],
          ].map(([l, s], idx) => (
            <div
              key={l as string}
              className={cn("flex-1 px-4 py-3", idx < 2 && "border-r border-border")}
            >
              <div className="text-[11px] text-muted-foreground">{l}</div>
              <div className="mt-0.5 text-2xl font-extrabold tabular-nums">{Math.round(s as number)}</div>
            </div>
          ))}
        </div>

        {/* Axis breakdowns */}
        <AxisSection axis={item.fit} />
        <AxisSection axis={item.quality} />
        <AxisSection axis={item.auth} badge="AI 분석 (데모)" />

        {/* Evidence */}
        {evidence.length > 0 && (
          <section className="mt-5">
            {(more ? evidence : evidence.slice(0, 2)).map((e, i) => (
              <p key={i} className="mb-2 border-l-2 border-border pl-3 text-[13px] text-foreground/80">
                “{e}”
              </p>
            ))}
            {p.c3.ad_speak_flags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {p.c3.ad_speak_flags.map((f) => (
                  <span key={f} className="rounded border border-border px-1.5 py-0.5 text-[10px]">
                    상투어: {f}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              {more ? "접기" : "근거 더 보기 · 서사 전문 보기"}
            </button>
            {more && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-[12px] leading-relaxed text-muted-foreground">
                {p.story_text}
              </p>
            )}
            <div className="mt-3 text-[12px] text-muted-foreground">
              <b className="text-foreground">큐레이터</b> {p.b4.comment} ({p.b4.rating}/5)
            </div>
          </section>
        )}

        {/* Price */}
        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 text-[13px] leading-relaxed">
          <b className="font-bold">단가 비교</b>
          <br />
          제안 단가 {item.price.price}만원 · 예상 조회수 {fmt(item.price.viewsLow)}~{fmt(item.price.viewsHigh)}
          <br />
          비슷한 규모의 {p.selected_categories[0]} 인플루언서들과 비교하면{" "}
          <b className="font-bold">
            {item.price.deltaPct === 0
              ? "비슷한 수준의 단가예요"
              : `약 ${Math.abs(item.price.deltaPct)}% ${item.price.deltaPct > 0 ? "높은" : "낮은"} 단가예요`}
          </b>
          <div className="mt-1 text-[11px] text-muted-foreground">
            예상 조회수는 최근 성과를 기반으로 한 추정치입니다 · 적용 가중치: 적합도 {WEIGHTS.fit * 100} · 역량{" "}
            {WEIGHTS.quality * 100} · 진정성 {WEIGHTS.auth * 100}
          </div>
        </div>
      </div>

      {/* Sticky actions */}
      <div className="sticky bottom-0 border-t border-border bg-background px-6 py-3 md:px-8">
        {rejecting ? (
          <div>
            <div className="mb-2 text-xs font-medium">거절 사유 선택</div>
            <div className="flex flex-wrap gap-1.5">
              {REJECT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleReason(r)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    reasons.includes(r)
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={reasons.length === 0}
                onClick={() => {
                  onDecision("거절", reasons);
                  setRejecting(false);
                }}
                className="h-10 flex-1 rounded-full bg-foreground text-sm font-bold text-background disabled:bg-muted disabled:text-muted-foreground"
              >
                거절 확정
              </button>
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="h-10 rounded-full border border-border px-5 text-sm text-muted-foreground hover:text-foreground"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className={cn(
                "h-11 flex-1 rounded-full border text-sm font-bold",
                decision === "거절"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-accent",
              )}
            >
              거절
            </button>
            <button
              type="button"
              onClick={() => onDecision("협의")}
              className={cn(
                "h-11 flex-1 rounded-full border text-sm font-bold",
                decision === "협의"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-accent",
              )}
            >
              협의
            </button>
            <button
              type="button"
              onClick={() => onDecision("수락")}
              className="h-11 flex-[1.4] rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
            >
              수락
            </button>
          </div>
        )}
      </div>
    </div>
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
  const { filters, setFilters } = useDashboard();
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
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  // Keep a valid selection as the filtered list changes.
  useEffect(() => {
    if (!visible.some((v) => v.proposal.id === selectedId)) {
      setSelectedId(visible[0]?.proposal.id ?? null);
    }
  }, [visible, selectedId]);

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
          <Detail
            key={selected.proposal.id}
            item={selected}
            decision={decisions[selected.proposal.id] ?? null}
            onDecision={(d) => setDecisions((prev) => ({ ...prev, [selected.proposal.id]: d }))}
            onBack={() => setMobileDetail(false)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-8 text-center">
            <p className="text-sm font-medium">조건에 맞는 제안이 없어요</p>
            <p className="text-xs text-muted-foreground">사이드바 “설정” 또는 상단 필터를 조정해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
