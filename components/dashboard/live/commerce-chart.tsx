"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProductSnapshot, SnapshotEvent } from "@/components/dashboard/live/types";

const FG = "var(--color-foreground)";
const MUTED = "var(--color-muted-foreground)";
const AXIS = { tickLine: false, axisLine: false, tick: { fill: MUTED, fontSize: 10 } } as const;

const won = (n: number) => (n >= 100000000 ? `${(n / 100000000).toFixed(1)}억` : n >= 10000 ? `${Math.round(n / 10000)}만` : n.toLocaleString());
const md = (iso: string) => `${+iso.slice(5, 7)}/${+iso.slice(8, 10)}`;

// 첫 스냅샷~오늘(최대 90일) 연속 일자축을 만들고 결측일은 null → 이 빠진 그래프.
function buildSeries(snaps: ProductSnapshot[]) {
  const byDate = new Map(snaps.map((s) => [s.captured_at, s]));
  const today = new Date();
  const first = new Date(snaps[0].captured_at + "T00:00:00Z");
  const start = new Date(Math.max(first.getTime(), today.getTime() - 89 * 864e5));
  const rows: { date: string; revenue: number | null; review_count: number | null; price: number | null; rank: number | null }[] = [];
  for (let d = new Date(start); d <= today; d = new Date(d.getTime() + 864e5)) {
    const iso = d.toISOString().slice(0, 10);
    const s = byDate.get(iso);
    rows.push({
      date: iso,
      revenue: s?.revenue ?? null,
      review_count: s?.review_count ?? null,
      price: s?.price ?? null,
      rank: s?.rank ?? null,
    });
  }
  return rows;
}

function Tip({ active, payload, label, unit, fmt }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string; fmt: (n: number) => string }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] shadow-sm">
      <span className="text-muted-foreground">{label ? md(String(label)) : ""} · </span>
      <span className="font-semibold">{fmt(payload[0].value)}{unit}</span>
    </div>
  );
}

function MetricChart({
  title, subtitle, data, dataKey, unit, fmt, events, invert,
}: {
  title: string; subtitle?: string; data: ReturnType<typeof buildSeries>; dataKey: string;
  unit: string; fmt: (n: number) => string; events: SnapshotEvent[]; invert?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[13px] font-semibold">{title}</h4>
        {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="mt-2 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={MUTED} strokeOpacity={0.12} vertical={false} />
            <XAxis dataKey="date" {...AXIS} tickFormatter={md} minTickGap={24} />
            <YAxis {...AXIS} width={34} reversed={invert} tickFormatter={(v) => fmt(Number(v))} domain={invert ? [1, "auto"] : ["auto", "auto"]} />
            <Tooltip content={<Tip unit={unit} fmt={fmt} />} />
            {events.map((e) => (
              <ReferenceLine key={e.date + e.label} x={e.date} stroke={FG} strokeDasharray="3 3" strokeOpacity={0.5}
                label={{ value: "수락", position: "top", fill: MUTED, fontSize: 9 }} />
            ))}
            <Line type="monotone" dataKey={dataKey} stroke={FG} strokeWidth={2} dot={{ r: 2.5, fill: FG }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CommerceChart({ snapshots, events }: { snapshots: ProductSnapshot[]; events: SnapshotEvent[] }) {
  const sorted = [...snapshots].sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  const series = buildSeries(sorted);
  const distinctDays = new Set(sorted.map((s) => s.captured_at)).size;
  const gapDays = series.filter((r) => r.revenue == null && r.review_count == null && r.price == null && r.rank == null).length;

  const has = (k: keyof ProductSnapshot) => sorted.some((s) => s[k] != null);
  const hasRevenue = has("revenue");
  const hasReviews = has("review_count");
  const hasPrice = has("price");
  const hasRank = has("rank");

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">성과 추적</h2>
        <span className="text-[11px] text-muted-foreground">최근 90일{gapDays > 0 ? " · 일부 날짜 미수집" : ""}</span>
      </div>

      {distinctDays < 2 && (
        <p className="mt-1 text-[11px] text-muted-foreground">데이터 축적 중 · 매일 자동 수집됩니다. 하루가 더 쌓이면 추세가 보여요.</p>
      )}

      <div className="mt-2 grid gap-3">
        {hasRevenue && (
          <MetricChart title="매출액" subtitle="역제안 수락 이후 변화" data={series} dataKey="revenue" unit="원" fmt={won} events={events} />
        )}
        {hasReviews && (
          <MetricChart title="리뷰 수" subtitle="누적" data={series} dataKey="review_count" unit="개" fmt={(n) => n.toLocaleString()} events={events} />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {hasPrice && <MetricChart title="판매가" data={series} dataKey="price" unit="원" fmt={won} events={[]} />}
          {hasRank && <MetricChart title="카테고리 순위" subtitle="낮을수록 상위" data={series} dataKey="rank" unit="위" fmt={(n) => `#${n}`} events={[]} invert />}
        </div>
      </div>
    </section>
  );
}
