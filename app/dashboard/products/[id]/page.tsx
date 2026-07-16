"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, Star, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Band = { lo: number; hi: number };
type ChartMouse = { activeTooltipIndex?: unknown; activeLabel?: unknown };
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { getProduct, type ContentItem, type Product, type ProductEvent, type ProductPoint } from "@/components/dashboard/seed-products";

const fmtN = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n.toLocaleString());

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (platform === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M13 3h2.2c.25 1.7 1.25 3 3 3.25v2.25c-1.1 0-2.1-.32-3-.9v5.65a4.75 4.75 0 1 1-4.75-4.75c.27 0 .53.02.8.07v2.35a2.4 2.4 0 1 0 1.75 2.31V3z" />
      </svg>
    );
  }
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

const PLATFORM_LABEL: Record<string, string> = { instagram: "인스타그램", youtube: "유튜브", tiktok: "틱톡" };

const FG = "var(--color-foreground)";
const MUTED = "var(--color-muted-foreground)";
const AXIS = { tickLine: false, axisLine: false, tick: { fill: MUTED, fontSize: 11 } } as const;
const MARGIN = { top: 6, right: 8, bottom: 0, left: 8 };

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

function RangeArea({ series, band }: { series: ProductPoint[]; band: Band | null }) {
  if (!band) return null;
  return <ReferenceArea x1={series[band.lo].date} x2={series[band.hi].date} fill={FG} fillOpacity={0.07} stroke="none" ifOverflow="visible" />;
}

// 판매 순위 차트 + 이벤트 마커 오버레이 + 드래그 구간 선택.
function RankChartWithMarkers({ series, events, category, band, onDown, onMove, onUp, showHint }: {
  series: ProductPoint[]; events: ProductEvent[]; category: string;
  band: Band | null;
  onDown: (s: ChartMouse) => void; onMove: (s: ChartMouse) => void; onUp: () => void;
  showHint: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = series.length - 1;
  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0 md:px-5">
      <h3 className="text-sm font-semibold leading-tight">판매 순위</h3>
      <p className="text-xs text-muted-foreground">최근 90일 · {category} 카테고리 순위 (낮을수록 상위 · 더미)</p>
      <div className="relative mt-2">
        <div className="h-[150px] cursor-crosshair select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 20, right: 8, bottom: 0, left: 8 }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}>
              <XAxis dataKey="date" hide />
              <YAxis hide reversed domain={["dataMin", "dataMax"]} />
              <RangeArea series={series} band={band} />
              <Tooltip cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} content={<RankTip />} />
              <Line type="monotone" dataKey="rank" stroke={FG} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {showHint && (
          <div className="pointer-events-none absolute right-2 top-1.5 hidden rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] text-background md:block">
            드래그해서 구간을 살펴보세요
          </div>
        )}
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

// ── 관련 콘텐츠 우측 레일 ───────────────────────────────────────────────
function RailCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:bg-foreground/[0.03]"
    >
      <div className="relative flex aspect-square items-center justify-center bg-muted text-[10px] text-muted-foreground/50">
        이미지
        <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-background/90 text-foreground/80">
          <PlatformIcon platform={item.platform} className="size-3" />
        </span>
      </div>
      <div className="p-2">
        <div className="truncate text-[11px] font-medium">{item.handle}</div>
        <div className="mt-0.5 text-xs font-bold tabular-nums">
          {fmtN(item.views)}<span className="ml-1 text-[10px] font-normal text-muted-foreground">views</span>
        </div>
      </div>
    </button>
  );
}

const dnum = (d: string) => { const [m, dd] = d.split("/").map(Number); return m * 100 + dd; };

function ContentRail({ content, sortBy, summary, onOpen }: {
  content: ContentItem[]; sortBy: "views" | "date"; summary?: React.ReactNode; onOpen: (c: ContentItem) => void;
}) {
  const platforms = (["instagram", "youtube", "tiktok"] as const).filter((pl) => content.some((c) => c.platform === pl));
  const counts = Object.fromEntries(platforms.map((pl) => [pl, content.filter((c) => c.platform === pl).length]));
  const [tab, setTab] = useState<string | null>(null);
  const activeTab = tab && platforms.includes(tab as (typeof platforms)[number]) ? tab : (platforms.slice().sort((a, b) => counts[b] - counts[a])[0] ?? null);
  const items = content
    .filter((c) => c.platform === activeTab)
    .sort((a, b) => (sortBy === "views" ? b.views - a.views : dnum(b.date) - dnum(a.date)));

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-border bg-card lg:max-h-[calc(100svh-9rem)]">
      {summary}
      <div className="border-b border-border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold">관련 콘텐츠</span>
          <span className="text-[11px] text-muted-foreground">{sortBy === "views" ? "조회수순" : "최신순"}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {platforms.map((pl) => (
            <button key={pl} type="button" onClick={() => setTab(pl)} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors", activeTab === pl ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              <PlatformIcon platform={pl} className="size-3" />
              {PLATFORM_LABEL[pl]} {counts[pl]}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {items.map((c) => <RailCard key={c.id} item={c} onClick={() => onOpen(c)} />)}
          </div>
        ) : (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">이 구간엔 게시물이 없어요.</p>
        )}
      </div>
    </div>
  );
}

function ContentModal({ item, onOpenChange }: { item: ContentItem | null; onOpenChange: (o: boolean) => void }) {
  return (
    <Modal open={!!item} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md md:rounded-2xl md:border-0 md:shadow-xl">
        <ModalHeader className="sr-only">
          <ModalTitle>{item?.handle ?? "콘텐츠"}</ModalTitle>
        </ModalHeader>
        {item && (
          <ModalBody className="p-4 md:p-5">
            <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground/50">이미지</div>
            <div className="mt-4 flex items-center gap-2">
              <PlatformIcon platform={item.platform} className="size-4 shrink-0 text-foreground/70" />
              <span className="truncate text-base font-bold">{item.handle}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{item.date}</span>
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground">
              {PLATFORM_LABEL[item.platform]} · 팔로워 {fmtN(item.followers)} · 반응률 {item.engagement}%
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border">
              {([["조회", item.views], ["좋아요", item.likes], ["댓글", item.comments]] as const).map(([l, v]) => (
                <div key={l} className="p-3 text-center">
                  <div className="text-lg font-extrabold tabular-nums">{fmtN(v)}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <a
              href={item.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
            >
              게시물 보기 <ExternalLink className="size-4" />
            </a>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const p: Product | undefined = getProduct(id);
  const [openItem, setOpenItem] = useState<ContentItem | null>(null);

  // 드래그 구간 선택 (커스텀 오버레이). band = 확정 구간, drag = 실시간.
  const [band, setBand] = useState<Band | null>(null);
  const [drag, setDrag] = useState<{ start: number; end: number } | null>(null);
  const [hintSeen, setHintSeen] = useState(false);
  const dragging = useRef(false);
  const dateIdx = useMemo(() => new Map((p?.series ?? []).map((s, i) => [s.date, i] as const)), [p]);

  const idxFrom = (s: ChartMouse | null | undefined) => {
    const i = s?.activeTooltipIndex;
    if (typeof i === "number") return i;
    const l = s?.activeLabel;
    if (l != null) return dateIdx.get(String(l)) ?? null;
    return null;
  };
  const onDown = (s: ChartMouse) => { const i = idxFrom(s); if (i == null) return; dragging.current = true; setDrag({ start: i, end: i }); };
  const onMove = (s: ChartMouse) => { if (!dragging.current) return; const i = idxFrom(s); if (i == null) return; setDrag((d) => (d ? { ...d, end: i } : { start: i, end: i })); };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setHintSeen(true);
    setDrag((d) => {
      if (d) { const lo = Math.min(d.start, d.end), hi = Math.max(d.start, d.end); setBand(lo === hi ? null : { lo, hi }); }
      return null;
    });
  };
  useEffect(() => {
    const up = () => onUp();
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const content = p.content ?? [];

  // 확정 or 드래그 중인 밴드 → 전 차트 공유 하이라이트.
  const activeBand: Band | null = drag ? { lo: Math.min(drag.start, drag.end), hi: Math.max(drag.start, drag.end) } : band;

  // 구간 요약 + 구간 콘텐츠.
  const inBand = (d: string) => { const i = dateIdx.get(d); return band != null && i != null && i >= band.lo && i <= band.hi; };
  const rangeContent = band ? content.filter((c) => inBand(c.date)) : content;
  const rangeInfo = band
    ? {
        from: p.series[band.lo].date, to: p.series[band.hi].date,
        rankFrom: p.series[band.lo].rank, rankTo: p.series[band.hi].rank,
        reviews: p.series.slice(band.lo, band.hi + 1).reduce((a, s) => a + s.reviews, 0),
        count: rangeContent.length,
        markers: p.events.filter((e) => e.day >= band.lo && e.day <= band.hi),
        rep: [...rangeContent].sort((a, b) => b.views - a.views)[0] ?? null,
      }
    : null;

  const summaryNode = rangeInfo ? (
    <div className="border-b border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">구간 요약</span>
        <button type="button" onClick={() => setBand(null)} aria-label="선택 해제" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">{rangeInfo.from} ~ {rangeInfo.to}</div>
      <div className="mt-2 space-y-1 text-[13px]">
        <div className="flex justify-between"><span className="text-muted-foreground">순위 변화</span><span className="font-semibold tabular-nums">#{rangeInfo.rankFrom} → #{rangeInfo.rankTo}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">신규 리뷰</span><span className="font-semibold tabular-nums">+{rangeInfo.reviews}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">구간 콘텐츠</span><span className="font-semibold tabular-nums">{rangeInfo.count}건</span></div>
      </div>
      {rangeInfo.markers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {rangeInfo.markers.map((e) => (
            <span key={e.n} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">
              <span className="grid size-3.5 place-items-center rounded-full bg-foreground text-[9px] font-bold text-background">{e.n}</span>
              {e.label.split(" ")[0]} 포함
            </span>
          ))}
        </div>
      )}
      {rangeInfo.rep && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[12px]">
          <PlatformIcon platform={rangeInfo.rep.platform} className="size-3 shrink-0 text-foreground/70" />
          <span className="truncate font-medium">{rangeInfo.rep.handle}</span>
          <span className="ml-auto shrink-0 text-muted-foreground">대표 · {fmtN(rangeInfo.rep.views)} views</span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
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
          <div className="col-span-2 bg-foreground p-4 text-background md:col-span-1">
            <div className="text-sm opacity-70">카테고리 순위</div>
            <div className="mt-1.5 flex items-baseline gap-1.5 text-2xl font-bold tracking-tight tabular-nums">
              #{firstRank}<span className="text-base opacity-70">→</span>#{bestRank}
            </div>
            <div className="mt-2 text-xs opacity-70">첫 관측 → 최고</div>
          </div>
          <StatCard label="리뷰 증가" value={`+${reviewGain.toLocaleString()}`} caption="최근 90일" />
          <StatCard label="콘텐츠 속도" value={`${contentRate}/월`} caption="게시량 기준" />
          <StatCard label="누적 크리에이터" value={`${p.cumulativeCreators}명`} caption="참여 계정" />
          <StatCard label="역제안 수" value={`${p.proposals}건`} caption="이 제품 관련" />
        </div>

        {/* Charts + 관련 콘텐츠 우측 레일 (lg 미만: 레일이 아래로) */}
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
          <RankChartWithMarkers series={p.series} events={p.events} category={p.category} band={activeBand} onDown={onDown} onMove={onMove} onUp={onUp} showHint={!hintSeen && !activeBand} />

          <ChartRow title="신규 리뷰" subtitle="일별 신규 리뷰 수 (더미)" height={80}>
            <BarChart data={p.series} margin={MARGIN}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <RangeArea series={p.series} band={activeBand} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<ReviewTip />} />
              <Bar dataKey="reviews" fill={FG} radius={[2, 2, 0, 0]} maxBarSize={5} />
            </BarChart>
          </ChartRow>

          <ChartRow title="판매가" subtitle="가격 변동 (더미)" height={80}>
            <LineChart data={p.series} margin={MARGIN}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 2000", "dataMax + 2000"]} />
              <RangeArea series={p.series} band={activeBand} />
              <Tooltip cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} content={<PriceTip />} />
              <Line type="stepAfter" dataKey="price" stroke={FG} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartRow>

          <ChartRow title="콘텐츠 게시량" subtitle="브랜드 태그 콘텐츠 · IG/YT (더미)" height={100}>
            <BarChart data={p.series} margin={MARGIN}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" {...AXIS} dy={4} interval={14} />
              <YAxis hide />
              <RangeArea series={p.series} band={activeBand} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<ContentTip />} />
              <Bar dataKey="ig" stackId="c" fill={FG} maxBarSize={6} />
              <Bar dataKey="yt" stackId="c" fill={FG} fillOpacity={0.35} radius={[2, 2, 0, 0]} maxBarSize={6} />
            </BarChart>
          </ChartRow>
        </div>

        {content.length > 0 && (
          <aside className="w-full lg:sticky lg:top-0 lg:w-[300px] lg:shrink-0">
            <ContentRail content={rangeContent} sortBy={band ? "views" : "date"} summary={summaryNode} onOpen={setOpenItem} />
          </aside>
        )}
        </div>
      </div>

      <ContentModal item={openItem} onOpenChange={(o) => { if (!o) setOpenItem(null); }} />
    </div>
  );
}
