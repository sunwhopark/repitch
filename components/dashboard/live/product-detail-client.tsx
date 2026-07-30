"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, LineChart, ExternalLink, RefreshCw, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFormModal } from "@/components/dashboard/live/product-form-modal";
import { SnapshotEntryModal } from "@/components/dashboard/live/snapshot-entry-modal";
import { CommerceChart } from "@/components/dashboard/live/commerce-chart";
import { CAMPAIGN_STATUS_LABEL, won, type Product, type DbCampaign, type ProductSnapshot, type SnapshotEvent } from "@/components/dashboard/live/types";

type LinkedCampaign = Pick<DbCampaign, "id" | "goal" | "status" | "created_at">;

export function ProductDetailClient({
  product,
  campaigns,
  brandId,
  proposalCount = 0,
  snapshots = [],
  events = [],
}: {
  product: Product;
  campaigns: LinkedCampaign[];
  brandId: string;
  proposalCount?: number;
  snapshots?: ProductSnapshot[];
  events?: SnapshotEvent[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectMsg, setCollectMsg] = useState("");

  async function collectNow() {
    setCollecting(true);
    setCollectMsg("");
    try {
      const res = await fetch("/api/products/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (data.collected) { setCollectMsg("수집 완료 · 차트에 반영했어요."); router.refresh(); }
      else setCollectMsg(data.reason ?? "지금은 수집하지 못했어요.");
    } catch {
      setCollectMsg("네트워크 오류. 다시 시도해 주세요.");
    }
    setCollecting(false);
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-3xl">
        <button type="button" onClick={() => router.push("/dashboard/products")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> 제품 목록
        </button>

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-[16/9] w-full bg-muted">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-10" /></div>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight">{product.name}</h1>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", product.visible ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
                    {product.visible ? "공개" : "비공개"}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {product.category && <span>{product.category}</span>}
                  <span className="tabular-nums">{won(product.price)}</span>
                  {product.sales_channel && <span>{product.sales_channel}</span>}
                  {product.product_url && (
                    <a href={product.product_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline underline-offset-2">
                      상세 <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setEditOpen(true)} className="inline-flex h-9 shrink-0 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-accent">
                수정
              </button>
            </div>
            {product.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{product.description}</p>}
          </div>
        </div>

        {/* 받은 역제안 (제품 직접) */}
        {proposalCount > 0 && (
          <a href="/dashboard/inbox" className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-foreground/[0.03]">
            <span className="font-medium">받은 역제안 {proposalCount}건</span>
            <span className="text-muted-foreground">인박스에서 보기 →</span>
          </a>
        )}

        {/* 연결된 캠페인 */}
        <section className="mt-4">
          <h2 className="text-sm font-bold">연결된 캠페인</h2>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
            {campaigns.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">이 제품에 연결된 캠페인이 없어요.</p>
            ) : (
              campaigns.map((c) => (
                <button key={c.id} type="button" onClick={() => router.push(`/dashboard/campaigns/${c.id}`)} className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-foreground/[0.03]">
                  <span className="truncate text-sm">{c.goal || "캠페인"}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{CAMPAIGN_STATUS_LABEL[c.status]}</span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* 성과 추적 — 수집 컨트롤 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setEntryOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-sm font-bold text-background">
            <PenLine className="size-4" /> 지표 직접 입력
          </button>
          <button type="button" disabled={collecting || !product.product_url} onClick={collectNow} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium hover:bg-accent disabled:opacity-50">
            <RefreshCw className={cn("size-4", collecting && "animate-spin")} /> {collecting ? "수집 중…" : "지금 수집"}
          </button>
          {collectMsg && <span className="text-[12px] text-muted-foreground">{collectMsg}</span>}
        </div>
        {!product.product_url && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">자동 수집하려면 제품 수정에서 상세 URL(쿠팡·네이버)을 넣어주세요. 매출·주문은 직접 입력해요.</p>
        )}

        {snapshots.length > 0 ? (
          <CommerceChart snapshots={snapshots} events={events} />
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            <LineChart className="size-5 shrink-0" />
            <span>데이터 축적 중 · 매일 자동 수집되고, [지표 직접 입력]으로 매출·리뷰를 바로 쌓을 수 있어요.</span>
          </div>
        )}
      </div>

      <ProductFormModal open={editOpen} onOpenChange={setEditOpen} brandId={brandId} initial={product} />
      <SnapshotEntryModal open={entryOpen} onOpenChange={setEntryOpen} productId={product.id} defaultPrice={product.price} />
    </div>
  );
}
