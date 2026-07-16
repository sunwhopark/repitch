"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  HERO_CARD,
  STAT_CARDS,
  DAILY,
  INFLUENCER_RANKING,
  RECENT_ACTIVITY,
} from "@/components/dashboard/seed-kpi";

const FG = "var(--color-foreground)";
const MUTED = "var(--color-muted-foreground)";
const AXIS = { tickLine: false, axisLine: false, tick: { fill: MUTED, fontSize: 11 } } as const;

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
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

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const w = 72, h = 26;
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <polyline points={pts} />
    </svg>
  );
}

const fmtCount = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n.toLocaleString();

type TipProps = {
  active?: boolean;
  label?: string;
  payload?: { value: number; dataKey: string }[];
};

function ReachTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-md">
      <span className="opacity-60">{label} · 도달</span>{" "}
      <span className="font-semibold">{fmtCount(payload[0].value)}</span>
    </div>
  );
}

function ProposalTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-md">
      <span className="opacity-60">{label} · 역제안</span>{" "}
      <span className="font-semibold">{payload[0].value}건</span>
    </div>
  );
}

function ContentTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const val = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? 0;
  return (
    <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-md">
      <div className="mb-1 opacity-60">{label}</div>
      <div className="flex items-center justify-between gap-3"><span className="opacity-80">Instagram</span><span className="font-semibold">{val("ig")}건</span></div>
      <div className="flex items-center justify-between gap-3"><span className="opacity-80">YouTube</span><span className="font-semibold">{val("yt")}건</span></div>
    </div>
  );
}

/** One row of the shared-axis time-series stack. */
function ChartRow({
  title,
  subtitle,
  legend,
  height,
  children,
}: {
  title: string;
  subtitle: string;
  legend?: React.ReactNode;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0 md:px-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {legend}
      </div>
      <div className="mt-1.5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-bold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

const MARGIN = { top: 4, right: 8, bottom: 0, left: 8 };

export default function DashboardHome() {
  // "진행 중 캠페인" reflects live campaigns (seed 3 + any created this session).
  const router = useRouter();
  const { campaigns } = useDashboard();
  const activeCampaigns = campaigns.filter((c) => c.status === "진행 중").length;
  const [highlightPerf, setHighlightPerf] = useState(false);

  const scrollToPerf = () => {
    document.getElementById("campaign-perf")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightPerf(true);
    window.setTimeout(() => setHighlightPerf(false), 1600);
  };
  const onStatClick = (label: string) => {
    if (label === "진행 중 캠페인") router.push("/dashboard/campaigns?status=active");
    else scrollToPerf(); // 이번 달 도달 · 평균 참여율 · 광고비 집행
  };

  // 진행 중 우선 정렬.
  const perfCampaigns = [...campaigns].sort((a, b) =>
    a.status !== b.status ? (a.status === "진행 중" ? -1 : 1) : (b.perf?.reach ?? 0) - (a.perf?.reach ?? 0),
  );

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">최근 30일 캠페인 성과 요약이에요.</p>

        {/* Stat row — dark hero card + 4 metrics, bordered grid (all clickable) */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border md:grid-cols-5 md:divide-y-0">
          <button
            type="button"
            onClick={() => router.push("/dashboard/inbox")}
            className="relative col-span-2 bg-foreground p-4 text-left text-background transition-colors hover:bg-foreground/90 md:col-span-1"
          >
            <div className="text-sm opacity-70">{HERO_CARD.label}</div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight">{HERO_CARD.value}</div>
            <div className="mt-2 text-xs opacity-70">{HERO_CARD.caption}</div>
            <Sparkline data={HERO_CARD.spark} className="absolute bottom-3 right-3 h-5 w-14 text-background/70" />
          </button>
          {STAT_CARDS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onStatClick(s.label)}
              className="p-4 text-left transition-colors hover:bg-foreground/[0.03]"
            >
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-1.5 text-xl font-bold tracking-tight tabular-nums">
                {s.label === "진행 중 캠페인" ? activeCampaigns : s.value}
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                {s.up ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                <span className="font-medium text-foreground">{s.deltaLabel}</span>
                <span>{s.caption}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Time-series stack — shared 30-day axis */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <ChartRow title="도달 추이" subtitle="최근 30일 일별 도달 (더미)" height={120}>
            <AreaChart data={DAILY} margin={MARGIN}>
              <defs>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={FG} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={FG} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={[0, "dataMax"]} />
              <Tooltip cursor={{ stroke: MUTED, strokeDasharray: "3 3" }} content={<ReachTooltip />} />
              <Area type="monotone" dataKey="reach" stroke={FG} strokeWidth={2} fill="url(#reachGrad)" />
            </AreaChart>
          </ChartRow>

          <ChartRow title="역제안 유입" subtitle="일별 도착한 역제안 건수 (더미)" height={70}>
            <BarChart data={DAILY} margin={MARGIN}>
              <XAxis dataKey="date" hide />
              <YAxis hide allowDecimals={false} domain={[0, 2]} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<ProposalTooltip />} />
              <Bar dataKey="proposals" fill={FG} radius={[2, 2, 0, 0]} maxBarSize={9} />
            </BarChart>
          </ChartRow>

          <ChartRow
            title="콘텐츠 게시량"
            subtitle="브랜드 태그 콘텐츠 · IG/YT (더미)"
            height={100}
            legend={
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-foreground" /> IG</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-foreground/35" /> YT</span>
              </div>
            }
          >
            <BarChart data={DAILY} margin={MARGIN}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" {...AXIS} dy={4} interval={4} />
              <YAxis hide allowDecimals={false} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<ContentTooltip />} />
              <Bar dataKey="ig" stackId="c" fill={FG} maxBarSize={12} />
              <Bar dataKey="yt" stackId="c" fill={FG} fillOpacity={0.35} radius={[2, 2, 0, 0]} maxBarSize={12} />
            </BarChart>
          </ChartRow>
        </div>

        {/* 캠페인별 성과 — 스탯 카드(도달·참여율·광고비)에서 스크롤 진입 */}
        <section
          id="campaign-perf"
          className={cn(
            "mt-4 scroll-mt-4 overflow-hidden rounded-xl border bg-card transition-all",
            highlightPerf ? "border-foreground ring-2 ring-foreground/25" : "border-border",
          )}
        >
          <div className="px-5 pt-5">
            <h2 className="text-sm font-bold">캠페인별 성과</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">최근 30일 · 진행 중 우선</p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pl-5 pr-3 font-medium">캠페인</th>
                  <th className="py-2 pr-3 font-medium">상태</th>
                  <th className="py-2 pr-3 text-right font-medium">역제안</th>
                  <th className="py-2 pr-3 text-right font-medium">도달</th>
                  <th className="py-2 pr-3 text-right font-medium">참여율</th>
                  <th className="py-2 pr-5 text-right font-medium">집행 비용</th>
                </tr>
              </thead>
              <tbody>
                {perfCampaigns.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-foreground/[0.03]"
                  >
                    <td className="py-2 pl-5 pr-3 font-medium">{c.product}</td>
                    <td className="py-2 pr-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", c.status === "진행 중" ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.funnel.proposals}건</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.perf ? fmtCount(c.perf.reach) : "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{c.perf ? `${c.perf.engagement}%` : "—"}</td>
                    <td className="py-2 pr-5 text-right tabular-nums">{c.perf ? `${(c.perf.spend / 10000).toLocaleString()}만원` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom — ranking + activity */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="인플루언서 랭킹" subtitle="이번 달 성과 기준 Top 5">
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">#</th>
                    <th className="py-2 pr-2 font-medium">프로필</th>
                    <th className="py-2 pr-2 text-right font-medium">팔로워</th>
                    <th className="py-2 pr-2 text-right font-medium">도달</th>
                    <th className="py-2 text-right font-medium">참여율</th>
                  </tr>
                </thead>
                <tbody>
                  {INFLUENCER_RANKING.map((r) => (
                    <tr key={r.profile_name} className="border-b border-border last:border-0">
                      <td className="py-2 pr-2 font-semibold tabular-nums text-muted-foreground">{r.rank}</td>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={r.platform} className="size-3.5 shrink-0 text-foreground/70" />
                          <span className="truncate font-medium">{r.profile_name}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">{fmtCount(r.followers)}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{fmtCount(r.reach)}</td>
                      <td className="py-2 text-right tabular-nums">{r.engagement}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="최근 활동" subtitle="워크스페이스 활동 피드">
            <ul className="mt-3 space-y-2.5">
              {RECENT_ACTIVITY.map((a, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {a.profile.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{a.profile}</span>
                    <span className="text-muted-foreground"> {a.text}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
