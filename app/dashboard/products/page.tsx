"use client";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { SEED_PRODUCTS, type Product } from "@/components/dashboard/seed-products";

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 96, h = 30;
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 3) - 1.5}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} />
    </svg>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {channel}
    </span>
  );
}

function ProductCard({ p, onClick }: { p: Product; onClick: () => void }) {
  // 순위 스파크라인 — 낮을수록 좋으니 반전해서 상승=개선으로 보이게.
  const rankInverted = p.series.map((s) => -s.rank);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-foreground/[0.03]"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] text-muted-foreground/60">
          이미지
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold">{p.name}</h3>
            <ChannelBadge channel={p.channel} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>순위 <b className="font-semibold text-foreground tabular-nums">#{p.rank}</b></span>
            <span>리뷰 <b className="font-semibold text-foreground tabular-nums">{p.reviews.toLocaleString()}</b></span>
            <span className="flex items-center gap-0.5">
              <Star className="size-3 fill-foreground text-foreground" />
              <b className="font-semibold text-foreground tabular-nums">{p.rating}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm font-semibold tabular-nums">{p.price.toLocaleString()}원</div>
        <Sparkline values={rankInverted} className="h-7 w-24 text-foreground/70" />
      </div>
    </button>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">제품</h1>
        <p className="mt-1 text-sm text-muted-foreground">제품별 커머스 성과를 추적해요.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SEED_PRODUCTS.map((p) => (
            <ProductCard key={p.id} p={p} onClick={() => router.push(`/dashboard/products/${p.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
