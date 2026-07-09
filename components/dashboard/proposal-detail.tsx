"use client";
import { useState } from "react";
import { ChevronLeft, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEIGHTS, type Axis, type ScoredProposal } from "@/lib/scoring";

// Shared 역제안 상세 패널 — used by the inbox split view and the campaign
// detail inline panel. Presentational: decision state lives in the dashboard
// context so both surfaces stay in sync.

export type Decision = "거절" | "협의" | "수락";
export const REJECT_REASONS = ["카테고리 부적합", "단가 과다", "오디언스 불일치", "진정성 부족", "일정 불가"];

export function fmt(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(n % 10000 ? 1 : 0)}만` : n.toLocaleString();
}
const shortLabel = (l: string) => l.replace(" (점수에서 제외)", "");

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
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

export function ProposalDetail({
  item,
  decision,
  onDecision,
  onBack,
  onClose,
}: {
  item: ScoredProposal;
  decision: Decision | null;
  onDecision: (d: Decision, reasons?: string[]) => void;
  onBack: () => void;
  onClose: () => void;
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
            {/* 프로필명 → 플랫폼 프로필 새 탭 (데모: 플랫폼 홈) */}
            <a
              href={p.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-lg font-bold hover:underline"
            >
              <span className="truncate">{p.profile_name}</span>
              <PlatformIcon platform={p.platform} className="size-4 shrink-0 text-foreground/70" />
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </a>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              팔로워 {fmt(p.profile_count)} · {p.product_name} · {p.creator_type} · {p.creator_gender} · 제안 단가{" "}
              <b className="font-semibold text-foreground">{p.expected_price}만원</b>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-start gap-3">
            <div className="text-right">
              <div className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">
                {Math.round(item.composite)}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">종합점수</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="상세 닫기"
              className="hidden size-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:grid"
            >
              <X className="size-4" />
            </button>
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
