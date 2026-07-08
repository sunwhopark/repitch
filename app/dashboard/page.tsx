"use client";
import { ChevronUp, ChevronDown } from "lucide-react";
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
import {
  STAT_CARDS,
  REACH_TREND,
  PLATFORM_PERF,
  INFLUENCER_RANKING,
  RECENT_ACTIVITY,
} from "@/components/dashboard/seed-kpi";

const FG = "var(--color-foreground)";
const MUTED = "var(--color-muted-foreground)";

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

const fmtCount = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n.toLocaleString();

function ReachTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-md">
      <span className="opacity-60">도달</span>{" "}
      <span className="font-semibold">{fmtCount(payload[0].value)}</span>
    </div>
  );
}

function PerfTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-md">
      <div className="mb-1 opacity-60">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="opacity-80">{p.dataKey === "instagram" ? "Instagram" : "YouTube"}</span>
          <span className="font-semibold">{p.value}건</span>
        </div>
      ))}
    </div>
  );
}

function Card({ title, subtitle, children, className }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <h2 className="text-sm font-bold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

export default function DashboardHome() {
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">대시보드</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">최근 30일 캠페인 성과 요약이에요.</p>

        {/* Stat cards — bordered grid */}
        <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border md:grid-cols-4 md:divide-y-0">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="p-5">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{s.value}</div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                {s.up ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                <span className="font-medium text-foreground">{s.deltaLabel}</span>
                <span>{s.caption}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card title="도달 추이" subtitle="최근 7일 일별 도달 (더미)">
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REACH_TREND} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={FG} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={FG} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: MUTED, fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} content={<ReachTooltip />} />
                  <Bar dataKey="reach" fill="url(#reachGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="플랫폼별 성과" subtitle="일별 매칭 성사 건수 (더미)">
            {/* legend (identity by line darkness, never color) */}
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-foreground" /> Instagram
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-foreground/40" /> YouTube
              </span>
            </div>
            <div className="mt-2 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PLATFORM_PERF} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: MUTED, fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis hide />
                  <Tooltip content={<PerfTooltip />} />
                  <Line type="stepAfter" dataKey="instagram" stroke={FG} strokeWidth={2} dot={false} />
                  <Line
                    type="stepAfter"
                    dataKey="youtube"
                    stroke={FG}
                    strokeOpacity={0.4}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Bottom */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
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
                      <td className="py-2.5 pr-2 font-semibold tabular-nums text-muted-foreground">{r.rank}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={r.platform} className="size-3.5 shrink-0 text-foreground/70" />
                          <span className="truncate font-medium">{r.profile_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 text-right tabular-nums text-muted-foreground">
                        {fmtCount(r.followers)}
                      </td>
                      <td className="py-2.5 pr-2 text-right tabular-nums">{fmtCount(r.reach)}</td>
                      <td className="py-2.5 text-right tabular-nums">{r.engagement}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="최근 활동" subtitle="워크스페이스 활동 피드">
            <ul className="mt-4 space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
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
