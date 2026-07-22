"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { offerLabel, fmtMD, won, type ActiveCampaign, type VisibleProduct } from "@/components/influencer/types";

function CampaignCard({ c, onClick }: { c: ActiveCampaign; onClick: () => void }) {
  const platforms = (c.platforms ?? "").split(",").map((s) => s.trim()).filter(Boolean).filter((p) => p !== "상관없음");
  return (
    <button type="button" onClick={onClick} className="overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:bg-foreground/[0.02]">
      <div className="aspect-[16/10] w-full bg-muted">
        {c.product_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.product_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-8" /></div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          {c.product_category && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{c.product_category}</span>}
          <span className="text-xs text-muted-foreground">{c.brand_name}</span>
        </div>
        <h3 className="mt-1.5 truncate text-[15px] font-semibold">{c.product_name ?? c.goal ?? "캠페인"}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{offerLabel(c.offer_type, c.deal_mode, c.deal_value)}</span>
          {(c.recruit_start || c.recruit_end) && <span>· 모집 {fmtMD(c.recruit_start)}–{fmtMD(c.recruit_end)}</span>}
          {platforms.length > 0 && <span>· {platforms.join("·")}</span>}
        </div>
      </div>
    </button>
  );
}

function ProductCard({ p, onClick }: { p: VisibleProduct; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:bg-foreground/[0.02]">
      <div className="aspect-[16/10] w-full bg-muted">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-8" /></div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          {p.category && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{p.category}</span>}
          <span className="text-xs text-muted-foreground">{p.brand_name}</span>
        </div>
        <h3 className="mt-1.5 truncate text-[15px] font-semibold">{p.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">{won(p.price)}</span>
          {p.sales_channel && <span>· {p.sales_channel}</span>}
        </div>
      </div>
    </button>
  );
}

export function CampaignsBrowse({ campaigns, products }: { campaigns: ActiveCampaign[]; products: VisibleProduct[] }) {
  const router = useRouter();
  const [seg, setSeg] = useState<"campaigns" | "products">("campaigns");
  const [cat, setCat] = useState<string>("전체");

  const categories = useMemo(() => {
    const set = new Set<string>();
    (seg === "campaigns" ? campaigns.map((c) => c.product_category) : products.map((p) => p.category)).forEach((c) => c && set.add(c));
    return ["전체", ...Array.from(set)];
  }, [campaigns, products, seg]);

  const campaignList = useMemo(() => {
    const f = cat === "전체" ? campaigns : campaigns.filter((c) => c.product_category === cat);
    return [...f].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [campaigns, cat]);
  const productList = useMemo(() => (cat === "전체" ? products : products.filter((p) => p.category === cat)), [products, cat]);

  const list = seg === "campaigns" ? campaignList : productList;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">캠페인 둘러보기</h1>
      <p className="mt-1 text-sm text-muted-foreground">체험하고 브랜드에 먼저 제안해 보세요.</p>

      {/* 세그먼트: 모집 중 캠페인 / 입점 제품 */}
      <div className="mt-4 flex rounded-full border border-border p-0.5">
        {([["campaigns", "모집 중 캠페인"], ["products", "입점 제품"]] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => { setSeg(k); setCat("전체"); }}
            className={cn("flex-1 rounded-full py-1.5 text-sm font-medium transition-colors", seg === k ? "bg-foreground text-background" : "text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      {categories.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors", cat === c ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {seg === "campaigns"
          ? campaignList.map((c) => <CampaignCard key={c.id} c={c} onClick={() => router.push(`/campaigns/${c.id}`)} />)
          : productList.map((p) => <ProductCard key={p.id} p={p} onClick={() => router.push(`/products/${p.id}`)} />)}
      </div>

      {list.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <Compass className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="text-sm font-semibold">{seg === "campaigns" ? "아직 열린 캠페인이 없어요" : "아직 공개된 제품이 없어요"}</p>
          <p className="text-xs text-muted-foreground">새로운 {seg === "campaigns" ? "캠페인" : "제품"}이 열리면 여기에 표시돼요.</p>
        </div>
      )}
    </div>
  );
}
