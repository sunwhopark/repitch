"use client";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { SEED_PRODUCTS, type Product } from "@/components/dashboard/seed-products";

const FG = "var(--color-foreground)";

// Display-only smoothing — 90 daily ranks → ~13 weekly averages. Inverted so
// improvement (rank ↓) reads as up. Seed 원본은 그대로 둔다.
function weeklyRank(series: Product["series"]): { i: number; v: number }[] {
  const out: { i: number; v: number }[] = [];
  for (let i = 0; i < series.length; i += 7) {
    const chunk = series.slice(i, i + 7);
    const avg = chunk.reduce((a, s) => a + s.rank, 0) / chunk.length;
    out.push({ i: out.length, v: -avg });
  }
  return out;
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {channel}
    </span>
  );
}

function ProductCard({ p, onClick }: { p: Product; onClick: () => void }) {
  const weekly = weeklyRank(p.series);
  const last = weekly.length - 1;
  const firstRank = p.series[0].rank;
  const bestRank = Math.min(...p.series.map((s) => s.rank));
  const improved = bestRank < firstRank;
  const gid = `rank-grad-${p.id}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-foreground/[0.03]"
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

      <div className="mt-auto">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-semibold tabular-nums">{p.price.toLocaleString()}원</div>
          {improved && (
            <div className="text-[11px] font-semibold tabular-nums text-muted-foreground">
              #{firstRank} <span className="opacity-40">→</span> #{bestRank}
            </div>
          )}
        </div>

        {/* 순위 추이 스파크라인 — 카드 하단 전폭 */}
        <div className="mt-2 border-t border-border pt-2.5">
          <div className="mb-1 text-[11px] font-medium text-muted-foreground">순위 추이 (90일)</div>
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FG} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={FG} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={FG}
                  strokeWidth={1.8}
                  fill={`url(#${gid})`}
                  isAnimationActive={false}
                  dot={(dp: { cx?: number; cy?: number; index?: number }) =>
                    dp.index === last && dp.cx != null && dp.cy != null ? (
                      <circle key="end" cx={dp.cx} cy={dp.cy} r={2.6} fill={FG} stroke="var(--color-background)" strokeWidth={1.5} />
                    ) : (
                      <g key={`e${dp.index}`} />
                    )
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
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
