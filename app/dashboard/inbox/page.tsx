"use client";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  scoreAll,
  passesFilters,
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

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
      <div className="h-full rounded-full bg-foreground" style={{ width: `${score}%` }} />
    </div>
  );
}

function AxisScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between gap-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums">{Math.round(score)}</span>
      </div>
      <ScoreBar score={score} />
    </div>
  );
}

function AxisBreakdown({ axis }: { axis: Axis }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span>
          {axis.key} · {axis.label}
        </span>
        <span className="tabular-nums">{Math.round(axis.score)}/100</span>
      </div>
      {axis.indicators.map((i) => (
        <div key={i.key} className="flex items-start justify-between gap-3 text-[12px]">
          <div className="min-w-0">
            <span className={cn(!i.available && "text-muted-foreground")}>
              {i.key} {i.label}
            </span>
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
  const [decision, setDecision] = useState<Decision | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);

  const badge = decision ?? p.status;
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
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              decision
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground",
            )}
          >
            {badge}
          </span>
          <div className="text-right">
            <div className="text-lg font-bold leading-none tabular-nums">
              {Math.round(item.composite)}
            </div>
            <div className="text-[10px] text-muted-foreground">종합</div>
          </div>
        </div>
      </div>

      {/* 3-axis scores */}
      <div className="mt-3 flex gap-4">
        <AxisScore label="Fit" score={item.fit.score} />
        <AxisScore label="Quality" score={item.quality.score} />
        <AxisScore label="Auth" score={item.auth.score} />
      </div>

      {/* meta */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
          {/* axis breakdowns */}
          <div className="grid gap-4 md:grid-cols-3">
            <AxisBreakdown axis={item.fit} />
            <AxisBreakdown axis={item.quality} />
            <AxisBreakdown axis={item.auth} />
          </div>

          {/* C evidence */}
          <div className="space-y-1">
            <div className="text-xs font-semibold">진정성 근거 (LLM 인용)</div>
            {[...p.c2.evidence, ...p.c3.evidence, ...p.c4.evidence].map((e, i) => (
              <p key={i} className="text-[12px] text-muted-foreground">“{e}”</p>
            ))}
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

          {/* B4 curator */}
          <div className="text-[12px]">
            <span className="font-semibold">큐레이터 코멘트</span>{" "}
            <span className="text-muted-foreground">
              ({p.b4.rating}/5) {p.b4.comment}
            </span>
          </div>

          {/* Price transparency (§5) */}
          <div className="rounded-lg bg-muted/40 p-3 text-[12px] leading-relaxed">
            <div className="mb-1 font-semibold">단가 투명성</div>
            제안 단가 {item.price.price}만원 · 예상 조회수 {fmt(item.price.viewsLow)}~
            {fmt(item.price.viewsHigh)} → 1만뷰당 {item.price.perTenKLow}~{item.price.perTenKHigh}만원
            <br />
            풀 중앙값 {item.price.benchmark}만원 대비{" "}
            <span className="font-medium text-foreground">
              {item.price.deltaPct > 0 ? "+" : ""}
              {item.price.deltaPct}%
            </span>
            <div className="mt-1 text-[11px] text-muted-foreground">
              예상 조회수는 과거 성과 기반 추정이며 보장 수치가 아닙니다.
            </div>
          </div>

          {/* Weights */}
          <div className="text-[11px] text-muted-foreground">
            적용 가중치 (기본): Fit {WEIGHTS.fit * 100}% · Quality {WEIGHTS.quality * 100}% · Auth{" "}
            {WEIGHTS.auth * 100}%
          </div>

          {/* Story */}
          <div>
            <div className="text-xs font-semibold">제안 서사</div>
            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
              {p.story_text}
            </p>
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

export default function InboxPage() {
  const { filters } = useDashboard();
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

      <div className="mt-6 space-y-3">
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
            필터로 제외된 제안 {excluded.length}건
          </button>
          {showExcluded && (
            <div className="mt-3 space-y-2">
              {excluded.map((s) => (
                <div
                  key={s.proposal.id}
                  className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground"
                >
                  <span>
                    {s.proposal.profile_name} · {s.proposal.creator_type} · {s.proposal.creator_gender} ·{" "}
                    {s.proposal.audience_country.join("/")}
                  </span>
                  <span className="tabular-nums">종합 {Math.round(s.composite)}</span>
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
