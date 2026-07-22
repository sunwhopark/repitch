"use client";

import { Send, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMD, type MySentProposalRow } from "@/components/influencer/types";

function decisionView(d: MySentProposalRow["decision"]) {
  if (!d) return { label: "검토 중", solid: false as const, tone: "muted" as const };
  if (d.decision === "accepted") return { label: "수락됨", solid: true as const, tone: "good" as const };
  if (d.decision === "rejected") return { label: "거절됨", solid: false as const, tone: "muted" as const };
  return { label: "협의 요청", solid: true as const, tone: "nego" as const };
}

export function SentProposalsList({ rows }: { rows: MySentProposalRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <Send className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold">아직 보낸 제안이 없어요</p>
          <p className="mt-1 text-xs text-muted-foreground">체험한 제품이나 입점 제품에 역제안을 보내보세요.</p>
        </div>
        <a href="/campaigns" className="mt-1 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:bg-foreground/90">둘러보기</a>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map(({ proposal: p, target: t, decision: d }) => {
        const dv = decisionView(d);
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex gap-3 p-3.5">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {t.product_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.product_image_url} alt="" className="h-full w-full object-cover" />
                ) : <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-6" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{t.product_name ?? "제품"}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    dv.tone === "good" ? "bg-foreground text-background" : dv.tone === "nego" ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
                    {dv.label}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t.brand_name} · {t.target_type === "campaign" ? "체험 캠페인" : "입점 제품"} · 제안 {p.expected_price ?? 0}만원 · {fmtMD(p.created_at.slice(0, 10))}
                </div>
              </div>
            </div>

            {/* 협의 요청 상세 (RLS로 인플루언서 열람 허용) */}
            {d?.decision === "negotiating" && (
              <div className="border-t border-border bg-muted/30 px-3.5 py-3">
                <div className="text-[13px] font-medium">브랜드가 협의를 요청했어요</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {d.reasons?.[0] && <span>사유: {d.reasons[0]}</span>}
                  {d.nego_discount_pct != null && <span className="font-medium text-foreground">단가 {d.nego_discount_pct}% 조정 제안</span>}
                </div>
                {d.memo && <div className="mt-1 text-xs text-muted-foreground">메모: {d.memo}</div>}
                {/* 응답(수락/역제안)은 v2 — 지금은 이메일 회신 안내. 추후 인앱 협상 연동. */}
                <div className="mt-2 rounded-lg bg-background px-3 py-2 text-[11px] text-muted-foreground">진행을 원하시면 담당 브랜드에 이메일로 회신해 주세요. 인앱 협상은 곧 열려요.</div>
              </div>
            )}
            {d?.decision === "rejected" && d.reasons?.length ? (
              <div className="border-t border-border px-3.5 py-2.5 text-xs text-muted-foreground">사유: {d.reasons.join(", ")}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
