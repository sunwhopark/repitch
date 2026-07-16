"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from "@/components/ui/modal";
import {
  SETTLEMENTS,
  FEE_RATE,
  feeOf,
  netOf,
  settlementSummary,
  type Settlement,
} from "@/components/dashboard/seed-settlements";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function StatusBadge({ status }: { status: Settlement["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "지급 완료"
          ? "bg-foreground text-background"
          : "border border-border text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function PaypalBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
      PayPal
    </span>
  );
}

export default function SettlementPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"국내" | "해외">("국내");
  const [detail, setDetail] = useState<Settlement | null>(null);

  const { pendingNet, paidThisMonthNet, feeTotal } = useMemo(settlementSummary, []);
  const counts = useMemo(
    () => ({
      국내: SETTLEMENTS.filter((s) => s.region === "국내").length,
      해외: SETTLEMENTS.filter((s) => s.region === "해외").length,
    }),
    [],
  );

  // 활성 탭 → 캠페인별 그룹(첫 등장 순서 유지).
  const groups = useMemo(() => {
    const rows = SETTLEMENTS.filter((s) => s.region === tab);
    const order: string[] = [];
    const byCampaign = new Map<string, Settlement[]>();
    for (const s of rows) {
      if (!byCampaign.has(s.campaign)) {
        byCampaign.set(s.campaign, []);
        order.push(s.campaign);
      }
      byCampaign.get(s.campaign)!.push(s);
    }
    return order.map((c) => ({ campaign: c, id: byCampaign.get(c)![0].campaignId, rows: byCampaign.get(c)! }));
  }, [tab]);

  const summaryCards = [
    { label: "정산 예정 총액", value: won(pendingNet), caption: "실지급액 기준" },
    { label: "이번 달 지급 완료", value: won(paidThisMonthNet), caption: "2026년 7월" },
    { label: "플랫폼 수수료 합계", value: won(feeTotal), caption: `요율 ${Math.round(FEE_RATE * 100)}%` },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">정산</h1>
        <p className="mt-1 text-sm text-muted-foreground">캠페인별 정산 내역과 지급 상태예요. (더미)</p>

        {/* 요약 카드 3 */}
        <div className="mt-4 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {summaryCards.map((c) => (
            <div key={c.label} className="p-4">
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div className="mt-1.5 text-xl font-bold tracking-tight tabular-nums">{c.value}</div>
              <div className="mt-2 text-xs text-muted-foreground">{c.caption}</div>
            </div>
          ))}
        </div>

        {/* 국내 / 해외 탭 */}
        <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border p-0.5">
          {(["국내", "해외"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t} {counts[t]}
            </button>
          ))}
        </div>

        {/* 캠페인별 그룹 */}
        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.campaign} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/campaigns/${g.id}`)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
              >
                <span className="text-sm font-semibold">{g.campaign}</span>
                <span className="text-xs text-muted-foreground">{g.rows.length}건</span>
              </button>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="py-2 pl-4 text-left font-medium">인플루언서</th>
                      <th className="py-2 pr-3 text-right font-medium">정산 금액</th>
                      <th className="py-2 pr-3 text-right font-medium">수수료</th>
                      <th className="py-2 pr-3 text-right font-medium">실지급액</th>
                      <th className="py-2 pr-4 text-right font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setDetail(s)}
                        className="cursor-pointer border-t border-border transition-colors hover:bg-foreground/[0.03]"
                      >
                        <td className="py-2.5 pl-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{s.name}</span>
                            {s.region === "해외" && <PaypalBadge />}
                          </div>
                          <div className="text-xs text-muted-foreground">{s.handle}</div>
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{won(s.amount)}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">-{won(feeOf(s))}</td>
                        <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{won(netOf(s))}</td>
                        <td className="py-2.5 pr-4 text-right"><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          계좌·PayPal 정보는 마스킹만 노출해요. 세금 처리는 정산 대행 연동 또는 지급 시점 수집으로 진행 예정이에요.
        </p>
      </div>

      {/* 행 상세 — 마스킹 계좌 */}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <ModalContent className="md:max-w-sm md:rounded-2xl">
          <ModalHeader className="text-left">
            <ModalTitle className="text-lg font-semibold">{detail?.name} · 정산 상세</ModalTitle>
          </ModalHeader>
          {detail && (
            <ModalBody className="space-y-4 px-4 pb-6 md:px-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{detail.handle}</span>
                <StatusBadge status={detail.status} />
              </div>
              <div className="rounded-xl border border-border">
                <Row label="캠페인" value={detail.campaign} />
                <Row label="정산 금액" value={won(detail.amount)} />
                <Row label={`수수료 (${Math.round(FEE_RATE * 100)}%)`} value={`-${won(feeOf(detail))}`} />
                <Row label="실지급액" value={won(netOf(detail))} strong />
                <Row
                  label={detail.status === "지급 완료" ? "지급 완료일" : "지급 예정일"}
                  value={detail.status === "지급 완료" ? detail.paidDate! : detail.dueDate!}
                />
                <Row
                  label={detail.region === "해외" ? "결제 수단" : "지급 계좌"}
                  value={detail.region === "해외" ? `PayPal · ${detail.paypalMasked}` : detail.bankMasked!}
                  last
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                계좌·결제 정보는 마스킹만 표시해요. 원문은 저장·노출하지 않아요.
              </p>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

function Row({ label, value, strong, last }: { label: string; value: string; strong?: boolean; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-3.5 py-2.5", !last && "border-b border-border")}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm tabular-nums", strong ? "font-bold" : "font-medium")}>{value}</span>
    </div>
  );
}
