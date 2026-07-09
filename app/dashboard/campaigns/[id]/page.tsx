"use client";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type {
  CampaignCreator,
  CampaignPost,
} from "@/components/dashboard/seed-campaigns";

const fmt = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n.toLocaleString());

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

// Funnel: 5 stages, each shows count + % of the previous stage. Monotone —
// stage progression encoded by dot lightness only.
const STAGES = [
  { key: "applied", label: "체험 신청" },
  { key: "selected", label: "선정" },
  { key: "shipped", label: "제품 발송" },
  { key: "trialing", label: "체험 중" },
  { key: "proposals", label: "역제안 도착" },
] as const;
const DOT_OPACITY = [0.25, 0.4, 0.55, 0.75, 1];

function CreatorRow({ c, onOpen }: { c: CampaignCreator; onOpen?: () => void }) {
  const clickable = c.status === "역제안 도착" && !!c.proposalId;
  const inner = (
    <>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {c.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{c.name}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <PlatformIcon platform={c.platform} className="size-3 shrink-0" />
          <span className="truncate">{c.handle}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums">{fmt(c.followers)}</div>
        <div className="text-[11px] text-muted-foreground">팔로워</div>
      </div>
      <CreatorStatusBadge status={c.status} />
      <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground", !clickable && "invisible")} />
    </>
  );
  const className = "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0";
  return clickable ? (
    <button type="button" onClick={onOpen} className={cn(className, "w-full text-left transition-colors hover:bg-foreground/[0.03]")}>
      {inner}
    </button>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function CreatorStatusBadge({ status }: { status: CampaignCreator["status"] }) {
  const emphasis = status === "역제안 도착";
  const muted = status === "미선정";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        emphasis
          ? "bg-foreground text-background"
          : muted
            ? "border border-border text-muted-foreground"
            : "bg-muted text-foreground",
      )}
    >
      {status}
    </span>
  );
}

function PostCard({ p }: { p: CampaignPost }) {
  return (
    <div className="w-64 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground/60">
        이미지
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-xs">
          <PlatformIcon platform={p.platform} className="size-3.5 shrink-0 text-foreground/70" />
          <span className="truncate font-medium">{p.handle}</span>
          <span className="ml-auto shrink-0 text-muted-foreground">{p.date}</span>
        </div>
        <div className="mt-2 text-lg font-bold tabular-nums">{p.views.toLocaleString()}<span className="ml-1 text-xs font-normal text-muted-foreground">views</span></div>
        <div className="mt-1 flex gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
          <span><b className="font-semibold text-foreground tabular-nums">{p.likes}</b> likes</span>
          <span><b className="font-semibold text-foreground tabular-nums">{p.comments}</b> comments</span>
        </div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { campaigns } = useDashboard();
  const c = campaigns.find((x) => x.id === id);

  if (!c) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">캠페인을 찾을 수 없어요.</p>
        <button type="button" onClick={() => router.push("/dashboard/campaigns")} className="text-sm underline">
          캠페인 목록으로
        </button>
      </div>
    );
  }

  const totals = c.posts.reduce(
    (a, p) => ({ views: a.views + p.views, likes: a.likes + p.likes, comments: a.comments + p.comments }),
    { views: 0, likes: 0, comments: 0 },
  );

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard/campaigns")}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> 캠페인
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", c.status === "진행 중" ? "bg-foreground" : "bg-muted-foreground/40")} />
          SEEDING CAMPAIGN REPORT
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{c.product}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.funnel.applied}명 크리에이터 신청 · {c.period} · {c.status}
        </p>

        {/* Funnel */}
        <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border md:grid-cols-5 md:divide-y-0">
          {STAGES.map((s, i) => {
            const value = c.funnel[s.key];
            const prev = i === 0 ? null : c.funnel[STAGES[i - 1].key];
            const pct = prev ? Math.round((value / prev) * 100) : null;
            return (
              <div key={s.key} className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-foreground" style={{ opacity: DOT_OPACITY[i] }} />
                  {s.label}
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {pct === null ? "체험단 지원" : `전 단계의 ${pct}%`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Posts (있을 때만 — 보통 종료 캠페인) */}
        {c.posts.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-bold">게시물</h2>
              <div className="text-xs text-muted-foreground">
                <b className="font-semibold text-foreground tabular-nums">{totals.views.toLocaleString()}</b> views ·{" "}
                <b className="font-semibold text-foreground tabular-nums">{totals.likes}</b> likes ·{" "}
                <b className="font-semibold text-foreground tabular-nums">{totals.comments}</b> comments
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {c.posts.map((p, i) => (
                <PostCard key={i} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Creators */}
        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-bold">크리에이터</h2>
            <div className="text-xs text-muted-foreground">{c.creators.length}명</div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {c.creators.map((cr, i) => (
              <CreatorRow
                key={i}
                c={cr}
                onOpen={() => router.push(`/dashboard/inbox?select=${cr.proposalId}`)}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            “역제안 도착” 크리에이터를 누르면 역제안 인박스에서 해당 제안이 열려요.
          </p>
        </section>
      </div>
    </div>
  );
}
