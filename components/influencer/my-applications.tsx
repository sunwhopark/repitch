"use client";

import { LayoutList, Package, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { offerLabel, APP_STATUS, type MyApplicationRow } from "@/components/influencer/types";

const CARRIER_URL: Record<string, (n: string) => string> = {
  CJ대한통운: (n) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${n}`,
  우체국: (n) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}`,
  한진택배: (n) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=${n}`,
  롯데택배: (n) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${n}`,
};

function trialWeek(iso: string | null): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000));
  return `${Math.max(1, Math.floor(days / 7) + 1)}주차`;
}

function StatusChip({ status }: { status: MyApplicationRow["application"]["status"] }) {
  const s = APP_STATUS[status];
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", s.solid ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
      {s.label}
    </span>
  );
}

export function MyApplications({ rows }: { rows: MyApplicationRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <LayoutList className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold">아직 지원한 캠페인이 없어요</p>
          <p className="mt-1 text-xs text-muted-foreground">마음에 드는 캠페인에 지원해 보세요.</p>
        </div>
        <a href="/campaigns" className="mt-1 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:bg-foreground/90">캠페인 둘러보기</a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">내 활동</h1>
      <p className="mt-1 text-sm text-muted-foreground">지원한 캠페인의 진행 상태예요.</p>

      <div className="mt-4 grid gap-3">
        {rows.map(({ application: a, campaign: c }) => (
          <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex gap-3 p-3.5">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {c.product_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.product_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-6" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{c.product_name ?? c.goal ?? "캠페인"}</span>
                  <StatusChip status={a.status} />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.brand_name} · {offerLabel(c.offer_type, c.deal_mode, c.deal_value)}</div>

                {a.status === "shipped" && a.tracking_no && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">{a.courier} · {a.tracking_no}</span>
                    {a.courier && CARRIER_URL[a.courier] && (
                      <a href={CARRIER_URL[a.courier](a.tracking_no)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2">
                        배송 조회 <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                )}
                {a.status === "in_trial" && (
                  <div className="mt-1.5 text-xs text-muted-foreground">체험 {trialWeek(a.delivered_at ?? a.shipped_at)} · {c.trial_weeks ? `총 ${c.trial_weeks}주` : ""}</div>
                )}
              </div>
            </div>

            {/* 체험 중 → 역제안서 쓰기 (2-D-2 연결 전까지 비활성) */}
            {a.status === "in_trial" && (
              <div className="border-t border-border px-3.5 py-2.5">
                <button type="button" disabled className="w-full rounded-full bg-muted py-2 text-xs font-semibold text-muted-foreground">
                  역제안서 쓰기 · 곧 열려요
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
