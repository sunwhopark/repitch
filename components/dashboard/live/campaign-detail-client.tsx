"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { CreateCampaignModal } from "@/components/ui/create-campaign-modal";
import { saveCampaignFromForm } from "@/components/dashboard/live/save-campaign";
import { formFromCampaignRow } from "@/components/dashboard/live/campaign-map";
import {
  CAMPAIGN_STATUS_LABEL,
  won,
  type DbCampaign,
  type Product,
  type CampaignApplication,
  type ApplicationStatus,
} from "@/components/dashboard/live/types";
import type { Campaign } from "@/components/dashboard/seed-campaigns";

const CARRIERS = ["CJ대한통운", "우체국", "한진택배", "롯데택배"];
const HOLD_REASONS = ["팔로워 규모", "카테고리 부적합", "콘텐츠 톤·스타일", "예산·단가", "기타"];

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "검토 대기",
  selected: "선정됨",
  held: "보류",
  shipped: "발송됨",
  in_trial: "체험 중",
  proposal_sent: "역제안 도착",
  not_selected: "미선정",
};

const fmtMD = (iso: string | null) => (iso ? `${+iso.split("-")[1]}/${+iso.split("-")[2]}` : "");

// 5단계 퍼널 — 상태 누적 집계
function funnelCounts(apps: CampaignApplication[]) {
  const inAny = (ss: ApplicationStatus[]) => apps.filter((a) => ss.includes(a.status)).length;
  return {
    applied: apps.length,
    selected: inAny(["selected", "shipped", "in_trial", "proposal_sent"]),
    shipped: inAny(["shipped", "in_trial", "proposal_sent"]),
    trialing: inAny(["in_trial", "proposal_sent"]),
    proposals: inAny(["proposal_sent"]),
  };
}
const FUNNEL: { key: keyof ReturnType<typeof funnelCounts>; label: string }[] = [
  { key: "applied", label: "체험 신청" },
  { key: "selected", label: "선정" },
  { key: "shipped", label: "제품 발송" },
  { key: "trialing", label: "체험 중" },
  { key: "proposals", label: "역제안 도착" },
];

export function CampaignDetailClient({
  campaign,
  product,
  applications,
  products,
  brandId,
  proposalCount = 0,
}: {
  campaign: DbCampaign;
  product: Product | null;
  applications: CampaignApplication[];
  products: { id: string; name: string }[];
  brandId: string;
  proposalCount?: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [shipId, setShipId] = useState<string | null>(null);
  const [courier, setCourier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState("");

  const f = funnelCounts(applications);

  async function patch(id: string, values: Partial<CampaignApplication>) {
    setBusy(true);
    await supabase.from("campaign_applications").update(values).eq("id", id);
    setBusy(false);
    router.refresh();
  }

  async function setStatus(next: DbCampaign["status"]) {
    setBusy(true);
    await supabase.from("campaigns").update({ status: next }).eq("id", campaign.id);
    setMenuOpen(false);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("이 캠페인을 삭제할까요?")) return;
    await supabase.from("campaigns").delete().eq("id", campaign.id);
    router.push("/dashboard/campaigns");
  }

  const editInitial: Campaign = {
    id: campaign.id,
    product: product?.name ?? "",
    offer: "",
    period: "",
    status: campaign.status === "ended" ? "종료" : "진행 중",
    funnel: { applied: 0, selected: 0, shipped: 0, trialing: 0, proposals: 0 },
    creators: [],
    posts: [],
    custom: true,
    form: formFromCampaignRow(campaign, product) as Campaign["form"],
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <button type="button" onClick={() => router.push("/dashboard/campaigns")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> 캠페인 목록
        </button>

        {/* 헤더 */}
        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {product?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/40"><Megaphone className="size-6" /></div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight">{product?.name ?? campaign.goal ?? "캠페인"}</h1>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", campaign.status === "active" ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
                  {CAMPAIGN_STATUS_LABEL[campaign.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {fmtMD(campaign.recruit_start)} – {fmtMD(campaign.recruit_end)}
                {campaign.recruit_count != null && ` · 모집 ${campaign.recruit_count}명`}
              </p>
            </div>
          </div>

          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="rounded-full border border-border p-2 hover:bg-accent">
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
                  <button type="button" onClick={() => { setEditOpen(true); setMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent">수정</button>
                  {campaign.status === "active" ? (
                    <button type="button" disabled={busy} onClick={() => setStatus("ended")} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent">종료로 전환</button>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => setStatus("active")} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent">진행 중으로 전환</button>
                  )}
                  <button type="button" onClick={remove} className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent">삭제</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 요약 */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-4">
          <div><div className="text-xs text-muted-foreground">목표</div><div className="mt-0.5 truncate font-medium">{campaign.goal ?? "—"}</div></div>
          <div><div className="text-xs text-muted-foreground">예산</div><div className="mt-0.5 font-medium tabular-nums">{won(campaign.budget)}</div></div>
          <div><div className="text-xs text-muted-foreground">제공</div><div className="mt-0.5 font-medium">{campaign.offer_type === "discount" ? "할인 판매" : "제품 무상 제공"} · {campaign.quantity ?? 1}개</div></div>
          <div><div className="text-xs text-muted-foreground">체험 기간</div><div className="mt-0.5 font-medium">{campaign.trial_weeks ? `${campaign.trial_weeks}주` : "—"}</div></div>
        </div>

        {/* 퍼널 — 역제안 도착은 실 proposal 수(인박스로 연결) */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border sm:grid-cols-5 sm:divide-y-0">
          {FUNNEL.map((s) => {
            const isProp = s.key === "proposals";
            const val = isProp ? proposalCount : f[s.key];
            const body = (
              <>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="mt-1.5 text-2xl font-bold tabular-nums">{val}</div>
              </>
            );
            return isProp && proposalCount > 0 ? (
              <a key={s.key} href="/dashboard/inbox" className="p-4 transition-colors hover:bg-foreground/[0.03]">{body}</a>
            ) : (
              <div key={s.key} className="p-4">{body}</div>
            );
          })}
        </div>

        {/* 지원자 */}
        <section className="mt-6">
          <h2 className="text-sm font-bold">지원자 {applications.length}</h2>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
            {applications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">아직 지원자가 없어요.</p>
            ) : (
              applications.map((a) => (
                <div key={a.id} className="border-b border-border px-4 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{a.ship_recipient ?? "지원자"}</div>
                      <div className="text-xs text-muted-foreground">{APP_STATUS_LABEL[a.status]}{a.hold_reason ? ` · ${a.hold_reason}` : ""}</div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {a.status === "applied" && (
                        <>
                          <button type="button" disabled={busy} onClick={() => patch(a.id, { status: "selected", selected_at: new Date().toISOString() })} className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">선정</button>
                          <button type="button" disabled={busy} onClick={() => setHoldingId(holdingId === a.id ? null : a.id)} className="rounded-full border border-border px-3 py-1 text-xs">보류</button>
                        </>
                      )}
                      {a.status === "held" && (
                        <button type="button" disabled={busy} onClick={() => patch(a.id, { status: "applied", hold_reason: null, hold_memo: null })} className="rounded-full border border-border px-3 py-1 text-xs">다시 검토</button>
                      )}
                      {a.status === "selected" && (
                        <>
                          <button type="button" disabled={busy} onClick={() => setShipId(shipId === a.id ? null : a.id)} className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">발송 등록</button>
                          <button type="button" disabled={busy} onClick={() => patch(a.id, { status: "applied", selected_at: null })} className="rounded-full border border-border px-3 py-1 text-xs">선정 취소</button>
                        </>
                      )}
                      {a.status === "shipped" && (
                        <button type="button" disabled={busy} onClick={() => patch(a.id, { status: "in_trial", delivered_at: new Date().toISOString() })} className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">배송 완료 처리</button>
                      )}
                    </div>
                  </div>

                  {/* 보류 사유 */}
                  {holdingId === a.id && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {HOLD_REASONS.map((r) => (
                        <button key={r} type="button" disabled={busy} onClick={() => { patch(a.id, { status: "held", hold_reason: r }); setHoldingId(null); }} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">{r}</button>
                      ))}
                    </div>
                  )}

                  {/* 발송 등록 폼 */}
                  {shipId === a.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <select value={courier} onChange={(e) => setCourier(e.target.value)} className="h-9 rounded-lg border border-border bg-transparent px-2 text-xs">
                        {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={tracking} onChange={(e) => setTracking(e.target.value.replace(/[^0-9]/g, ""))} placeholder="송장번호" className="h-9 flex-1 rounded-lg border border-border bg-transparent px-2 text-xs outline-none focus:border-foreground/40" />
                      <button type="button" disabled={busy || tracking.length < 6} onClick={() => { patch(a.id, { status: "shipped", courier, tracking_no: tracking, shipped_at: new Date().toISOString() }); setShipId(null); setTracking(""); }} className="rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background disabled:bg-muted disabled:text-muted-foreground">등록</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">배송 완료는 수동 처리예요. 실서비스에서는 배송추적 API로 자동 전환됩니다.</p>
        </section>
      </div>

      <CreateCampaignModal
        open={editOpen}
        onOpenChange={setEditOpen}
        products={products}
        initial={editInitial}
        onSubmit={async (c) => {
          if (busy || !c.form) return;
          setBusy(true);
          const { error } = await saveCampaignFromForm(supabase, c.form, brandId, campaign.id);
          setBusy(false);
          if (error) { alert(error); return; }
          setEditOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
