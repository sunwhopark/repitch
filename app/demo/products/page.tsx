"use client";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { SEED_PRODUCTS, type Product } from "@/components/dashboard/seed-products";

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {channel}
    </span>
  );
}

function ProductCard({ p, onClick }: { p: Product; onClick: () => void }) {
  const firstRank = p.series[0].rank;
  const bestRank = Math.min(...p.series.map((s) => s.rank));
  const improved = bestRank < firstRank;

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

      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold tabular-nums">{p.price.toLocaleString()}원</div>
        {improved && (
          <div className="text-xs font-semibold tabular-nums text-muted-foreground">
            #{firstRank} <span className="opacity-40">→</span> <span className="text-foreground">#{bestRank}</span>
          </div>
        )}
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
            <ProductCard key={p.id} p={p} onClick={() => router.push(`/demo/products/${p.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
