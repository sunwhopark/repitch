"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { CampaignMenu, useCampaignEditDelete } from "@/components/dashboard/campaign-actions";
import { ProposalDetail } from "@/components/dashboard/proposal-detail";
import { scoreAll } from "@/lib/scoring";
import {
  CARRIERS,
  applicantToCreator,
  type Applicant,
  type CampaignCreator,
  type CampaignPost,
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

const STAGES = [
  { key: "applied", label: "체험 신청" },
  { key: "selected", label: "선정" },
  { key: "shipped", label: "제품 발송" },
  { key: "trialing", label: "체험 중" },
  { key: "proposals", label: "역제안 도착" },
] as const;
const DOT_OPACITY = [0.25, 0.4, 0.55, 0.75, 1];

function CreatorStatusBadge({ status }: { status: CampaignCreator["status"] }) {
  const emphasis = status === "역제안 도착";
  const muted = status === "미선정";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        emphasis ? "bg-foreground text-background" : muted ? "border border-border text-muted-foreground" : "bg-muted text-foreground",
      )}
    >
      {status}
    </span>
  );
}

function trackUrlOf(t?: { carrier: string; number: string }) {
  if (!t) return null;
  return CARRIERS.find((x) => x.name === t.carrier)?.url(t.number) ?? null;
}

function CreatorRow({ c, selected, onOpen }: { c: CampaignCreator; selected?: boolean; onOpen: () => void }) {
  const clickable = c.status !== "미선정";
  const url = trackUrlOf(c.tracking);
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onOpen : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } } : undefined}
      className={cn(
        "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 transition-colors",
        clickable && "cursor-pointer",
        selected ? "bg-muted" : clickable && "hover:bg-foreground/[0.03]",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {c.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{c.name}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <PlatformIcon platform={c.platform} className="size-3 shrink-0" />
          <span className="truncate">{c.handle}</span>
        </div>
        {c.status === "발송됨" && c.tracking && (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <a href={url ?? "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-0.5 underline hover:text-foreground">
              {c.tracking.carrier} · {c.tracking.number}<ExternalLink className="size-2.5" />
            </a>
            <span>· 배송 추적 중</span>
          </div>
        )}
        {c.status === "체험 중" && c.trialStartDate && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">배송 완료 · 체험 시작 {c.trialStartDate}</div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold tabular-nums">{fmt(c.followers)}</div>
        <div className="text-[11px] text-muted-foreground">팔로워</div>
      </div>
      <CreatorStatusBadge status={c.status} />
      <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground", !clickable && "invisible")} />
    </div>
  );
}

function ApplicantRow({ a, onSelect, onHold }: { a: Applicant; onSelect: () => void; onHold: () => void }) {
  const decided = a.status !== "검토 대기";
  return (
    <div className={cn("flex items-center gap-3 border-b border-border px-4 py-3 last:border-0", a.status === "보류" && "opacity-45")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {a.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{a.name}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <PlatformIcon platform={a.platform} className="size-3 shrink-0" />
          <span className="truncate">{a.handle} · {a.category} · 참여율 {a.engagement}%</span>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="text-sm font-semibold tabular-nums">{fmt(a.followers)}</div>
        <div className="text-[11px] text-muted-foreground">팔로워</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-lg font-extrabold tabular-nums">{a.matchScore}</div>
        <div className="text-[11px] text-muted-foreground">매칭</div>
      </div>
      {decided ? (
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", a.status === "선정" ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
          {a.status}
        </span>
      ) : (
        <div className="flex shrink-0 gap-1.5">
          <button type="button" onClick={onHold} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">보류</button>
          <button type="button" onClick={onSelect} className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background hover:bg-foreground/90">선정</button>
        </div>
      )}
    </div>
  );
}

function PostCard({ p }: { p: CampaignPost }) {
  return (
    <div className="w-64 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground/60">이미지</div>
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

// ── 발송·배송 패널 ─────────────────────────────────────────────────────
function ShippingPanel({ cr, onRegister, onBack, onClose }: {
  cr: CampaignCreator;
  onRegister: (carrier: string, number: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [carrier, setCarrier] = useState(cr.tracking?.carrier ?? CARRIERS[0].name);
  const [number, setNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const ship = cr.shipping;
  const url = trackUrlOf(cr.tracking);

  const copy = async () => {
    if (!ship) return;
    try {
      await navigator.clipboard.writeText(`${ship.recipient} / ${ship.phone} / ${ship.address}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 px-6 py-6 md:px-8">
        <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden">
          <ChevronLeft className="size-4" /> 목록
        </button>

        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-base font-bold">{cr.name.charAt(0)}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="truncate">{cr.name}</span>
              <PlatformIcon platform={cr.platform} className="size-4 shrink-0 text-foreground/70" />
            </div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">{cr.handle} · 팔로워 {fmt(cr.followers)}</div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <CreatorStatusBadge status={cr.status} />
            <button type="button" onClick={onClose} aria-label="닫기" className="hidden size-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground md:grid">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 배송지 (복사) */}
        {ship && (
          <div className="mt-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">배송지</span>
              <button type="button" onClick={copy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Copy className="size-3.5" /> {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <div className="mt-2 space-y-1 text-[13px]">
              <div className="font-medium">{ship.recipient}</div>
              <div className="text-muted-foreground tabular-nums">{ship.phone}</div>
              <div className="text-muted-foreground">{ship.address}</div>
            </div>
          </div>
        )}

        {/* 발송 등록 (선정됨) */}
        {cr.status === "선정됨" && (
          <div className="mt-5">
            <div className="text-sm font-bold">발송 등록</div>
            <div className="mt-3 grid gap-2">
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="h-10 rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:border-foreground/40"
              >
                {CARRIERS.map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}
              </select>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="송장번호"
                className="h-10 rounded-xl border border-border bg-transparent px-3 text-sm tabular-nums outline-none focus:border-foreground/40"
              />
              <button
                type="button"
                disabled={number.trim().length < 6}
                onClick={() => onRegister(carrier, number.trim())}
                className="mt-1 h-11 rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                발송 등록
              </button>
            </div>
          </div>
        )}

        {/* 배송 추적 중 (발송됨) */}
        {cr.status === "발송됨" && cr.tracking && (
          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 text-[13px]">
            <div className="font-bold">배송 추적 중</div>
            <a href={url ?? "#"} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1 underline hover:text-foreground">
              {cr.tracking.carrier} · 송장 {cr.tracking.number}<ExternalLink className="size-3" />
            </a>
            <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              수령이 확인되면 자동으로 ‘체험 중’으로 전환돼요. 실서비스는 배송추적 API(스마트택배 등)로 상태를 동기화합니다.
            </div>
          </div>
        )}

        {/* 배송 완료 · 체험 시작 (체험 중) */}
        {cr.status === "체험 중" && (
          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 text-[13px]">
            <div className="font-bold">배송 완료 · 체험 시작</div>
            {cr.tracking && (
              <a href={url ?? "#"} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1 underline hover:text-foreground">
                {cr.tracking.carrier} · 송장 {cr.tracking.number}<ExternalLink className="size-3" />
              </a>
            )}
            <div className="mt-2">체험 시작일 <b className="font-semibold">{cr.trialStartDate}</b></div>
            <div className="mt-1 text-[11px] text-muted-foreground">체험 시작일은 진정성 평가(C1)의 기준점이 돼요.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
    >
      {children}
    </button>
  );
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { campaigns, mutateCampaign, decisions, setDecision } = useDashboard();
  const { startEdit, startDelete, modals } = useCampaignEditDelete(() => router.push("/dashboard/campaigns"));
  const c = campaigns.find((x) => x.id === id);

  const scored = useMemo(() => scoreAll(), []);
  const [view, setView] = useState<"roster" | "applicants">("roster");
  const [panelHandle, setPanelHandle] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  // ESC closes the panel (desktop).
  useEffect(() => {
    if (!panelHandle) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPanelHandle(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelHandle]);

  if (!c) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">캠페인을 찾을 수 없어요.</p>
        <button type="button" onClick={() => router.push("/dashboard/campaigns")} className="text-sm underline">캠페인 목록으로</button>
      </div>
    );
  }

  const applicants = [...(c.applicants ?? [])].sort((a, b) => b.matchScore - a.matchScore);
  const pending = applicants.filter((a) => a.status === "검토 대기").length;
  const selectedCreator = panelHandle ? c.creators.find((cr) => cr.handle === panelHandle) ?? null : null;
  const proposalItem =
    selectedCreator?.status === "역제안 도착" && selectedCreator.proposalId
      ? scored.find((s) => s.proposal.id === selectedCreator.proposalId) ?? null
      : null;

  const totals = c.posts.reduce(
    (a, p) => ({ views: a.views + p.views, likes: a.likes + p.likes, comments: a.comments + p.comments }),
    { views: 0, likes: 0, comments: 0 },
  );

  const openCreator = (cr: CampaignCreator) => {
    if (cr.status === "미선정") return;
    setPanelHandle(cr.handle);
    setMobileDetail(true);
  };

  const selectApplicant = (a: Applicant) =>
    mutateCampaign(c.id, (cur) => ({
      ...cur,
      applicants: (cur.applicants ?? []).map((x) => (x.id === a.id ? { ...x, status: "선정" as const } : x)),
      creators: [...cur.creators, applicantToCreator(a)],
      funnel: { ...cur.funnel, selected: cur.funnel.selected + 1 },
    }));

  const holdApplicant = (a: Applicant) =>
    mutateCampaign(c.id, (cur) => ({
      ...cur,
      applicants: (cur.applicants ?? []).map((x) => (x.id === a.id ? { ...x, status: "보류" as const } : x)),
    }));

  const registerShipment = (handle: string, carrier: string, num: string) => {
    mutateCampaign(c.id, (cur) => ({
      ...cur,
      creators: cur.creators.map((cr) => (cr.handle === handle ? { ...cr, status: "발송됨" as const, tracking: { carrier, number: num } } : cr)),
      funnel: { ...cur.funnel, shipped: cur.funnel.shipped + 1 },
    }));
    // 데모: 배송추적 API 대신 10초 뒤 자동 배송 완료 → 체험 중 전환.
    window.setTimeout(() => {
      mutateCampaign(c.id, (cur) => {
        const cr = cur.creators.find((x) => x.handle === handle);
        if (!cr || cr.status !== "발송됨") return cur;
        const t = new Date();
        const ds = `${t.getMonth() + 1}/${t.getDate()}`;
        return {
          ...cur,
          creators: cur.creators.map((x) => (x.handle === handle ? { ...x, status: "체험 중" as const, trialStartDate: ds } : x)),
          funnel: { ...cur.funnel, trialing: cur.funnel.trialing + 1 },
        };
      });
    }, 10000);
  };

  return (
    <div className="flex h-full">
      <div className={cn("min-w-0 flex-1 overflow-y-auto p-6 md:p-8", mobileDetail && "hidden md:block")}>
        <div className="mx-auto w-full max-w-4xl">
          <button type="button" onClick={() => router.push("/dashboard/campaigns")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> 캠페인
          </button>

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", c.status === "진행 중" ? "bg-foreground" : "bg-muted-foreground/40")} />
                SEEDING CAMPAIGN REPORT
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{c.product}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{c.funnel.applied}명 크리에이터 신청 · {c.period} · {c.status}</p>
            </div>
            <div className="mt-1">
              <CampaignMenu campaign={c} onEdit={() => startEdit(c)} onDelete={() => startDelete(c)} />
            </div>
          </div>

          {/* Funnel — 체험 신청 셀은 신청자 검토로 이동 */}
          <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border md:grid-cols-5 md:divide-y-0">
            {STAGES.map((s, i) => {
              const value = c.funnel[s.key];
              const prev = i === 0 ? null : c.funnel[STAGES[i - 1].key];
              const pct = prev ? Math.round((value / prev) * 100) : null;
              const clickable = s.key === "applied" && applicants.length > 0;
              const inner = (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-foreground" style={{ opacity: DOT_OPACITY[i] }} />
                    {s.label}
                  </div>
                  <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{pct === null ? (clickable ? "신청자 검토 →" : "체험단 지원") : `전 단계의 ${pct}%`}</div>
                </>
              );
              return clickable ? (
                <button key={s.key} type="button" onClick={() => setView("applicants")} className="p-4 text-left transition-colors hover:bg-foreground/[0.03]">{inner}</button>
              ) : (
                <div key={s.key} className="p-4">{inner}</div>
              );
            })}
          </div>

          {/* Posts */}
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
                {c.posts.map((p, i) => <PostCard key={i} p={p} />)}
              </div>
            </section>
          )}

          {/* Creators / Applicants */}
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-1 rounded-full border border-border p-0.5">
              <Tab active={view === "roster"} onClick={() => setView("roster")}>크리에이터 {c.creators.length}</Tab>
              <Tab active={view === "applicants"} onClick={() => setView("applicants")}>신청자 검토 {pending}</Tab>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {view === "roster"
                ? c.creators.map((cr, i) => (
                    <CreatorRow key={cr.handle + i} c={cr} selected={cr.handle === panelHandle} onOpen={() => openCreator(cr)} />
                  ))
                : applicants.length > 0
                  ? applicants.map((a) => (
                      <ApplicantRow key={a.id} a={a} onSelect={() => selectApplicant(a)} onHold={() => holdApplicant(a)} />
                    ))
                  : <p className="px-4 py-8 text-center text-sm text-muted-foreground">신청자가 없어요.</p>}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {view === "roster"
                ? "“역제안 도착”은 제안 상세, “선정됨/발송됨/체험 중”은 발송·배송 패널이 열려요."
                : "매칭 점수 내림차순 · 선정하면 크리에이터에 합류하고 선정 수가 올라가요."}
            </p>
          </section>
        </div>
      </div>

      {/* Right panel — 역제안 상세 OR 발송·배송 */}
      {selectedCreator && (
        <div className={cn("min-w-0 flex-1 md:w-[460px] md:flex-none md:border-l md:border-border", !mobileDetail && "hidden md:block")}>
          {proposalItem ? (
            <ProposalDetail
              key={proposalItem.proposal.id}
              item={proposalItem}
              decision={decisions[proposalItem.proposal.id] ?? null}
              onDecision={(d) => setDecision(proposalItem.proposal.id, d)}
              onBack={() => setMobileDetail(false)}
              onClose={() => setPanelHandle(null)}
            />
          ) : (
            <ShippingPanel
              key={selectedCreator.handle}
              cr={selectedCreator}
              onRegister={(carrier, num) => registerShipment(selectedCreator.handle, carrier, num)}
              onBack={() => setMobileDetail(false)}
              onClose={() => setPanelHandle(null)}
            />
          )}
        </div>
      )}

      {modals}
    </div>
  );
}
