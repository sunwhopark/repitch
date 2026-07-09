"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { getProduct, type Product, type ProductEvent, type ProductPoint } from "@/components/dashboard/seed-products";

const FG = "var(--color-foreground)";
const MUTED = "var(--color-muted-foreground)";
const AXIS = { tickLine: false, axisLine: false, tick: { fill: MUTED, fontSize: 11 } } as const;
const MARGIN = { top: 6, right: 8, bottom: 0, left: 8 };

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 80, h = 26;
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 2) - 1}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} />
    </svg>
  );
}

type TipProps = { active?: boolean; label?: string; payload?: { value: number; dataKey: string }[] };
function tipBox(children: React.ReactNode) {
  return <div className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-md">{children}</div>;
}
function RankTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return tipBox(<><span className="opacity-60">{label} · 순위</span> <span className="font-semibold">#{payload[0].value}</span></>);
}
function ReviewTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return tipBox(<><span className="opacity-60">{label} · 신규 리뷰</span> <span className="font-semibold">{payload[0].value}</span></>);
}
function PriceTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return tipBox(<><span className="opacity-60">{label} · 판매가</span> <span className="font-semibold">{payload[0].value.toLocaleString()}원</span></>);
}
function ContentTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const v = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? 0;
  return (
    <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-md">
      <div className="mb-1 opacity-60">{label}</div>
      <div className="flex justify-between gap-3"><span className="opacity-80">Instagram</span><span className="font-semibold">{v("ig")}건</span></div>
      <div className="flex justify-between gap-3"><span className="opacity-80">YouTube</span><span className="font-semibold">{v("yt")}건</span></div>
    </div>
  );
}

function ChartRow({ title, subtitle, height, children }: {
  title: string; subtitle: string; height: number; children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0 md:px-5">
      <h3 className="text-sm font-semibold leading-tight">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 판매 순위 차트 + 이벤트 마커 오버레이 (인플루언서 활동 ↔ 커머스 성과 연결).
function RankChartWithMarkers({ series, events, category }: { series: ProductPoint[]; events: ProductEvent[]; category: string }) {
  const [active, setActive] = useState<number | null>(null);
  const n = series.length - 1;
  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0 md:px-5">
      <h3 className="text-sm font-semibold leading-tight">판매 순위</h3>
      <p className="text-xs text-muted-foreground">최근 90일 · {category} 카테고리 순위 (낮을수록 상위 · 더미)</p>
      <div className="relative mt-2">
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 20, right: 8, bottom: 0, left: 8 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide reversed domain={["dataMin", "dataMax"]} />
              <Tooltip cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} content={<RankTip />} />
              <Line type="monotone" dataKey="rank" stroke={FG} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* markers */}
        <div className="pointer-events-none absolute inset-0">
          {events.map((e) => {
            const left = `calc(8px + ${e.day / n} * (100% - 16px))`;
            return (
              <div key={e.n} className="absolute inset-y-0" style={{ left }}>
                <div className="absolute top-7 bottom-0 w-px -translate-x-1/2 border-l border-dashed border-foreground/25" />
                <button
                  type="button"
                  onMouseEnter={() => setActive(e.n)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive(e.n)}
                  className="pointer-events-auto absolute top-0 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background ring-2 ring-background"
                >
                  {e.n}
                </button>
                {active === e.n && (
                  <div className="pointer-events-none absolute top-7 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-md">
                    {e.label} · {e.date}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="mt-2 text-[11px] text-muted-foreground">{caption}</div>
    </div>
  );
}

function RelatedCard({ handle, date, views, likes, comments }: {
  handle: string; date: string; views: number; likes: number; comments: number;
}) {
  return (
    <div className="w-60 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground/60">이미지</div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-medium">{handle}</span>
          <span className="shrink-0 text-muted-foreground">{date}</span>
        </div>
        <div className="mt-2 text-lg font-bold tabular-nums">{views.toLocaleString()}<span className="ml-1 text-xs font-normal text-muted-foreground">views</span></div>
        <div className="mt-1 flex gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
          <span><b className="font-semibold text-foreground tabular-nums">{likes}</b> likes</span>
          <span><b className="font-semibold text-foreground tabular-nums">{comments}</b> comments</span>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const p: Product | undefined = getProduct(id);

  if (!p) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">제품을 찾을 수 없어요.</p>
        <button type="button" onClick={() => router.push("/dashboard/products")} className="text-sm underline">제품 목록으로</button>
      </div>
    );
  }

  const firstRank = p.series[0].rank;
  const bestRank = Math.min(...p.series.map((s) => s.rank));
  const reviewGain = p.series.reduce((a, s) => a + s.reviews, 0);
  const contentTotal = p.series.reduce((a, s) => a + s.ig + s.yt, 0);
  const contentRate = Math.round(contentTotal / 3); // 3개월
  const rankInverted = p.series.map((s) => -s.rank);

  const related = p.events
    .filter((e) => e.n >= 2)
    .map((e, i) => ({
      handle: e.label.split(" ")[0],
      date: e.date,
      views: 1200 + i * 480 + p.rank * 12,
      likes: 74 + i * 22,
      comments: 9 + i * 4,
    }));

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard/products")}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> 제품
        </button>

        {/* Header product card */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] text-muted-foreground/60">이미지</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{p.name}</h1>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{p.channel}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.category}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-right">
            {[
              ["가격", `${p.price.toLocaleString()}원`],
              ["카테고리 순위", `#${p.rank}`],
              ["최고 순위", `#${bestRank}`],
              ["리뷰", p.reviews.toLocaleString()],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-[11px] text-muted-foreground">{l}</div>
                <div className="text-sm font-bold tabular-nums">{v}</div>
              </div>
            ))}
            <div>
              <div className="text-[11px] text-muted-foreground">평점</div>
              <div className="flex items-center justify-end gap-0.5 text-sm font-bold tabular-nums">
                <Star className="size-3 fill-foreground text-foreground" /> {p.rating}
              </div>
            </div>
          </div>
        </div>

        {/* Stat row — dark hero (카테고리 순위) + 4 metrics */}
        <div className="mt-5 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border md:grid-cols-5 md:divide-y-0">
          <div className="relative col-span-2 bg-foreground p-4 text-background md:col-span-1">
            <div className="text-sm opacity-70">카테고리 순위</div>
            <div className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-bold tracking-tight tabular-nums">
              #{firstRank}<span className="text-base opacity-70">→</span>#{bestRank}
            </div>
            <div className="mt-2 text-xs opacity-70">첫 관측 → 최고</div>
            <Sparkline values={rankInverted} className="absolute bottom-3 right-3 h-5 w-16 text-background/70" />
          </div>
          <StatCard label="리뷰 증가" value={`+${reviewGain.toLocaleString()}`} caption="최근 90일" />
          <StatCard label="콘텐츠 속도" value={`${contentRate}/월`} caption="게시량 기준" />
          <StatCard label="누적 크리에이터" value={`${p.cumulativeCreators}명`} caption="참여 계정" />
          <StatCard label="역제안 수" value={`${p.proposals}건`} caption="이 제품 관련" />
        </div>

        {/* Time-series stack — shared 90-day axis */}
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          <RankChartWithMarkers series={p.series} events={p.events} category={p.category} />

          <ChartRow title="신규 리뷰" subtitle="일별 신규 리뷰 수 (더미)" height={80}>
            <BarChart data={p.series} margin={MARGIN}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<ReviewTip />} />
              <Bar dataKey="reviews" fill={FG} radius={[2, 2, 0, 0]} maxBarSize={5} />
            </BarChart>
          </ChartRow>

          <ChartRow title="판매가" subtitle="가격 변동 (더미)" height={80}>
            <LineChart data={p.series} margin={MARGIN}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 2000", "dataMax + 2000"]} />
              <Tooltip cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} content={<PriceTip />} />
              <Line type="stepAfter" dataKey="price" stroke={FG} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartRow>

          <ChartRow title="콘텐츠 게시량" subtitle="브랜드 태그 콘텐츠 · IG/YT (더미)" height={100}>
            <BarChart data={p.series} margin={MARGIN}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" {...AXIS} dy={4} interval={14} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<ContentTip />} />
              <Bar dataKey="ig" stackId="c" fill={FG} maxBarSize={6} />
              <Bar dataKey="yt" stackId="c" fill={FG} fillOpacity={0.35} radius={[2, 2, 0, 0]} maxBarSize={6} />
            </BarChart>
          </ChartRow>
        </div>

        {/* Related content */}
        {related.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-bold">관련 콘텐츠</h2>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {related.map((r, i) => (
                <RelatedCard key={i} {...r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
