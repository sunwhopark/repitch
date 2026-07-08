"use client";
import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
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
const REJECT_REASONS = [
  "카테고리 부적합",
  "단가 과다",
  "오디언스 불일치",
  "진정성 부족",
  "일정 불가",
];

function fmt(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}만` : n.toLocaleString();
}

function AxisChip({ label, score }: { label: string; score: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{Math.round(score)}</span>
      <span className="hidden h-1 w-8 overflow-hidden rounded-full bg-foreground/10 sm:inline-block">
        <span className="block h-full rounded-full bg-foreground/60" style={{ width: `${score}%` }} />
      </span>
    </span>
  );
}

function AxisBreakdown({ axis, badge }: { axis: Axis; badge?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          {axis.label}
          {badge && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="tabular-nums">{Math.round(axis.score)}/100</span>
      </div>
      {axis.indicators.map((i) => (
        <div key={i.key} className="flex items-start justify-between gap-3 text-[12px]">
          <div className="min-w-0">
            <span className={cn(!i.available && "text-muted-foreground")}>{i.label}</span>
            {i.raw && <span className="ml-2 text-muted-foreground">· {i.raw}</span>}
            {i.note && (
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {i.note}
              </span>
            )}
          </div>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {i.available ? `${i.score}/${i.max}` : "제외"}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProposalCard({ item }: { item: ScoredProposal }) {
  const { proposal: p } = item;
  const [expanded, setExpanded] = useState(false);
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);

  const badge = decision ?? p.status;
  const evidence = [...p.c2.evidence, ...p.c3.evidence, ...p.c4.evidence];
  const shownEvidence = showAllEvidence ? evidence : evidence.slice(0, 2);
  const toggleReason = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{p.profile_name}</span>
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {p.platform === "instagram" ? "IG" : "YT"}
            </span>
            <span className="text-xs text-muted-foreground">팔로워 {fmt(p.profile_count)}</span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {p.product_name} · {p.creator_type} · {p.creator_gender}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              decision ? "bg-foreground text-background" : "border border-border text-muted-foreground",
            )}
          >
            {badge}
          </span>
          <div className="text-right">
            <div className="text-3xl font-bold leading-none tabular-nums">
              {Math.round(item.composite)}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">종합</div>
          </div>
        </div>
      </div>

      {/* Compact 3-axis */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <AxisChip label="적합도" score={item.fit.score} />
        <AxisChip label="역량" score={item.quality.score} />
        <AxisChip label="진정성" score={item.auth.score} />
      </div>

      {/* meta */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-muted-foreground">
          제안 단가 <span className="font-medium text-foreground">{p.expected_price}만원</span>
        </span>
        {item.labels.map((l) => (
          <span key={l} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {l}
          </span>
        ))}
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
        산출 근거 보기
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 border-t border-border pt-3 text-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <AxisBreakdown axis={item.fit} />
            <AxisBreakdown axis={item.quality} />
            <AxisBreakdown axis={item.auth} badge="AI 분석 (데모)" />
          </div>

          {/* C evidence (대표 2개 + 더 보기) */}
          {evidence.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold">진정성 근거</div>
              {shownEvidence.map((e, i) => (
                <p key={i} className="text-[12px] text-muted-foreground">“{e}”</p>
              ))}
              {evidence.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllEvidence((v) => !v)}
                  className="text-[11px] text-muted-foreground underline hover:text-foreground"
                >
                  {showAllEvidence ? "접기" : `더 보기 (${evidence.length - 2})`}
                </button>
              )}
              {p.c3.ad_speak_flags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.c3.ad_speak_flags.map((f) => (
                    <span key={f} className="rounded border border-border px-1.5 py-0.5 text-[10px]">
                      상투어: {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* B4 curator */}
          <div className="text-[12px]">
            <span className="font-semibold">큐레이터 코멘트</span>{" "}
            <span className="text-muted-foreground">
              ({p.b4.rating}/5) {p.b4.comment}
            </span>
          </div>

          {/* Price (§5) */}
          <div className="rounded-lg bg-muted/40 p-3 text-[12px] leading-relaxed">
            <div className="mb-1 font-semibold">단가 비교</div>
            제안 단가 {item.price.price}만원 · 예상 조회수 {fmt(item.price.viewsLow)}~
            {fmt(item.price.viewsHigh)}
            <br />
            비슷한 규모의 {p.selected_categories[0]} 인플루언서들과 비교하면{" "}
            <span className="font-medium text-foreground">
              {item.price.deltaPct === 0
                ? "비슷한 수준의 단가예요"
                : `약 ${Math.abs(item.price.deltaPct)}% ${item.price.deltaPct > 0 ? "높은" : "낮은"} 단가예요`}
            </span>
            <div className="mt-1 text-[11px] text-muted-foreground">
              예상 조회수는 최근 성과를 기반으로 한 추정치입니다.
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            적용 가중치 (기본): 적합도 {WEIGHTS.fit * 100}% · 역량 {WEIGHTS.quality * 100}% · 진정성{" "}
            {WEIGHTS.auth * 100}%
          </div>

          {/* Story (기본 접힘) */}
          <div>
            <button
              type="button"
              onClick={() => setShowStory((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold hover:text-foreground"
            >
              <ChevronDown className={cn("size-3.5 transition-transform", showStory && "rotate-180")} />
              제안 서사 전문
            </button>
            {showStory && (
              <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
                {p.story_text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {rejecting ? (
        <div className="mt-3 border-t border-border pt-3">
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
                setDecision("거절");
                setRejecting(false);
              }}
              className="h-8 rounded-full bg-foreground px-4 text-xs font-medium text-background disabled:bg-muted disabled:text-muted-foreground"
            >
              거절 확정
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="h-8 rounded-full border border-border px-4 text-xs text-muted-foreground hover:text-foreground"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="h-8 flex-1 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground"
          >
            거절
          </button>
          <button
            type="button"
            onClick={() => setDecision("협의")}
            className="h-8 flex-1 rounded-full border border-border text-xs hover:bg-accent"
          >
            협의
          </button>
          <button
            type="button"
            onClick={() => setDecision("수락")}
            className="h-8 flex-1 rounded-full bg-foreground text-xs font-medium text-background hover:bg-foreground/90"
          >
            수락
          </button>
        </div>
      )}
      {decision === "거절" && reasons.length > 0 && (
        <div className="mt-2 text-[11px] text-muted-foreground">사유: {reasons.join(", ")}</div>
      )}
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
    chips.push({
      key: "type",
      label: filters.creatorType,
      clear: () => setFilters({ ...filters, creatorType: "상관없음" }),
    });
  if (filters.gender !== "상관없음")
    chips.push({
      key: "gender",
      label: filters.gender,
      clear: () => setFilters({ ...filters, gender: "상관없음" }),
    });
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
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">적용 필터</span>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.clear}
          className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs hover:bg-accent"
        >
          {c.label}
          <X className="size-3 text-muted-foreground" />
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
    for (const s of scored) {
      (passesFilters(s.proposal, filters) ? visible : excluded).push(s);
    }
    return { visible, excluded };
  }, [scored, filters]);

  const [showExcluded, setShowExcluded] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">역제안 인박스</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        종합점수 순으로 정렬된 역제안서 {visible.length}건. 필터는 사이드바 “설정”에서 변경할 수 있어요.
      </p>

      <FilterChips filters={filters} setFilters={setFilters} />

      <div className="mt-5 space-y-3">
        {visible.map((item) => (
          <ProposalCard key={item.proposal.id} item={item} />
        ))}
      </div>

      {excluded.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowExcluded((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", showExcluded && "rotate-180")} />
            조건 불일치로 제외된 제안 {excluded.length}건
          </button>
          {showExcluded && (
            <div className="mt-3 space-y-2">
              {excluded.map((s) => (
                <div
                  key={s.proposal.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="min-w-0 truncate">
                    {s.proposal.profile_name} · {s.proposal.selected_categories[0]} ·{" "}
                    {s.proposal.creator_type}/{s.proposal.creator_gender}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      {exclusionReason(s.proposal, filters)}
                    </span>
                    <span className="tabular-nums">종합 {Math.round(s.composite)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-[11px] text-muted-foreground">
        데모 시드 데이터 · 실제 제출/개인정보는 사용하지 않습니다. 응답(거절/협의/수락)은 저장되지 않습니다.
      </p>
    </div>
  );
}
