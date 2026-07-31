"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, BadgeCheck, Send, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { PlatformIcon, fmt } from "@/components/dashboard/proposal-detail";
import { scoreProposal, type ScoreBrand } from "@/lib/scoring";
import type { SeedProposal } from "@/components/dashboard/seed-proposals";
import { BRAND_CATEGORIES } from "@/lib/brand-application-options";

export type DirInfluencer = {
  id: string;
  display_name: string | null;
  channels: { platform?: string; handle?: string; follower_count?: number | null; avg_views?: number | null; verified?: boolean }[] | null;
  category: string[] | null;
  creator_type: string | null;
  gender: string | null;
  countries: string[] | null;
};
export type DirCampaign = {
  id: string; goal: string | null; status: string; product_category: string | null;
  target_ages: string[] | null; target_gender: string | null; target_locales: string[] | null;
};

const PLATFORMS = ["instagram", "youtube", "tiktok"];
const primaryChannel = (inf: DirInfluencer) => inf.channels?.[0];
const isVerified = (inf: DirInfluencer) => !!inf.channels?.some((c) => c.verified);
const followers = (inf: DirInfluencer) => primaryChannel(inf)?.follower_count ?? 0;

// 매칭 점수 = 엔진 Fit축 재사용(demo와 동일 방식). 인플루언서를 합성 제안으로 만들어 캠페인 기준 채점.
function synth(inf: DirInfluencer): SeedProposal {
  const ch = primaryChannel(inf);
  const platform: "instagram" | "youtube" = ch?.platform === "youtube" ? "youtube" : "instagram";
  const views = Math.max(1, ch?.avg_views ?? Math.round(followers(inf) * 0.3));
  return {
    id: `synth-${inf.id}`, status: "신규", brand_name: "", product_name: inf.category?.[0] ?? "",
    platform, profile_name: inf.display_name ?? "", profile_url: "", profile_count: followers(inf),
    selected_categories: inf.category ?? [], peak_views: views, collab_count: "0회", story_text: "",
    content_types: [], content_tone: "", expected_price: Math.max(1, Math.round((2.5 * views) / 10000)),
    reuse_allowed: true, upload_date: "", created_at: "2026-07-01T00:00:00Z",
    creator_type: (inf.creator_type as "실물" | "버추얼") ?? "실물", creator_gender: (inf.gender as "여성" | "남성") ?? "여성",
    audience_country: inf.countries ?? [], trial_received_at: "2026-06-01T00:00:00Z",
    b4: { rating: 3, comment: "" }, c2: { level: 0, score: 0, evidence: [] },
    c3: { level: 0, score: 0, evidence: [], ad_speak_flags: [] }, c4: { level: 0, score: 0, evidence: [] },
  };
}
function campaignBrand(c: DirCampaign): ScoreBrand {
  return { category: c.product_category ?? "뷰티", target_ages: c.target_ages ?? [], target_gender: c.target_gender ?? "여성", target_countries: c.target_locales ?? [] };
}

export function InfluencersDirectory({
  influencers, campaigns, invitedPairs, appliedPairs, brandId,
}: {
  influencers: DirInfluencer[]; campaigns: DirCampaign[]; invitedPairs: string[]; appliedPairs: string[]; brandId: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("전체");
  const [plat, setPlat] = useState<string>("전체");
  const [matchId, setMatchId] = useState<string>(""); // 매칭 모드 캠페인
  const [selected, setSelected] = useState<DirInfluencer | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set(invitedPairs));

  const matchCampaign = campaigns.find((c) => c.id === matchId);
  const scores = useMemo(() => {
    if (!matchCampaign) return new Map<string, number>();
    const b = campaignBrand(matchCampaign);
    return new Map(influencers.map((inf) => [inf.id, Math.round(scoreProposal(synth(inf), undefined, b).fit.score)]));
  }, [matchCampaign, influencers]);

  const list = useMemo(() => {
    let r = influencers.filter((inf) => {
      if (cat !== "전체" && !(inf.category ?? []).includes(cat)) return false;
      if (plat !== "전체" && !(inf.channels ?? []).some((c) => c.platform === plat)) return false;
      if (q.trim() && !(inf.display_name ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
    if (matchCampaign) r = [...r].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    else r = [...r].sort((a, b) => followers(b) - followers(a));
    return r;
  }, [influencers, cat, plat, q, matchCampaign, scores]);

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-xl font-semibold tracking-tight">인플루언서 DB</h1>
        <p className="mt-1 text-sm text-muted-foreground">캠페인에 맞는 크리에이터를 찾아 직접 제안해요.</p>

        {/* 매칭 모드 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm">
            <Sparkles className="size-4" />
            <select value={matchId} onChange={(e) => setMatchId(e.target.value)} className="bg-transparent text-sm outline-none">
              <option value="">캠페인에 맞는 인플루언서 찾기</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.goal ?? "캠페인"} 기준 매칭</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="활동명 검색" className="h-9 w-40 rounded-full border border-border bg-transparent pl-8 pr-3 text-sm outline-none focus:border-foreground/40" />
          </div>
        </div>

        {/* 가벼운 필터 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["전체", ...BRAND_CATEGORIES].map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={cn("rounded-full border px-2.5 py-1 text-xs", cat === c ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")}>{c}</button>
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {["전체", ...PLATFORMS].map((p) => (
            <button key={p} type="button" onClick={() => setPlat(p)} className={cn("rounded-full border px-2.5 py-1 text-xs capitalize", plat === p ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")}>{p === "전체" ? "전체" : p}</button>
          ))}
        </div>

        {/* 목록 */}
        <div className="mt-4 grid gap-2">
          {list.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 인플루언서가 없어요.</p>
          ) : list.map((inf) => {
            const ch = primaryChannel(inf);
            return (
              <button key={inf.id} type="button" onClick={() => setSelected(inf)} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-foreground/[0.03]">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">{(inf.display_name ?? "?").charAt(0)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{inf.display_name}</span>
                      {isVerified(inf) && <BadgeCheck className="size-3.5 shrink-0 text-foreground" aria-label="채널 인증" />}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {ch && <PlatformIcon platform={ch.platform ?? "instagram"} className="size-3.5" />}
                      <span>{fmt(followers(inf))}</span>
                      {inf.category?.[0] && <span>· {inf.category[0]}</span>}
                    </div>
                  </div>
                </div>
                {matchCampaign && (
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-extrabold tabular-nums">{scores.get(inf.id) ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">매칭</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <InfluencerDetailModal
          inf={selected} campaigns={campaigns} brandId={brandId}
          invited={invited} appliedPairs={new Set(appliedPairs)}
          onClose={() => setSelected(null)}
          onInvited={(campaignId) => { setInvited((s) => new Set(s).add(`${campaignId}:${selected.id}`)); router.refresh(); }}
        />
      )}
    </div>
  );
}

function InfluencerDetailModal({
  inf, campaigns, brandId, invited, appliedPairs, onClose, onInvited,
}: {
  inf: DirInfluencer; campaigns: DirCampaign[]; brandId: string;
  invited: Set<string>; appliedPairs: Set<string>; onClose: () => void; onInvited: (campaignId: string) => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const pairState = (cid: string) => (invited.has(`${cid}:${inf.id}`) ? "invited" : appliedPairs.has(`${cid}:${inf.id}`) ? "applied" : "ok");

  async function send() {
    if (!campaignId || sending) return;
    setSending(true); setError("");
    const supabase = createClient();
    const { error: e } = await supabase.from("campaign_invitations").insert({ campaign_id: campaignId, influencer_id: inf.id, brand_id: brandId, message: message.trim() || null });
    setSending(false);
    if (e) { setError(e.code === "23505" ? "이미 초대한 캠페인이에요." : "제안에 실패했어요. 잠시 후 다시 시도해 주세요."); return; }
    onInvited(campaignId);
    setInviteOpen(false); setCampaignId(""); setMessage("");
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent className="md:max-w-md md:rounded-2xl">
        <ModalHeader className="text-left">
          <ModalTitle className="flex items-center gap-1.5 text-lg font-semibold">
            {inf.display_name}
            {isVerified(inf) && <BadgeCheck className="size-4 text-foreground" aria-label="채널 인증" />}
          </ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4 px-4 pb-6 md:px-6">
          {/* 채널 */}
          <div className="grid gap-1.5">
            {(inf.channels ?? []).map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <PlatformIcon platform={c.platform ?? "instagram"} className="size-4 text-muted-foreground" />
                <span className="font-medium">@{c.handle || "—"}</span>
                {c.verified && <BadgeCheck className="size-3.5 text-foreground" aria-label="인증" />}
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">팔로워 {fmt(c.follower_count ?? 0)}{c.avg_views ? ` · 평균 ${fmt(c.avg_views)}` : ""}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {(inf.category ?? []).map((c) => <span key={c} className="rounded-full bg-muted px-2 py-0.5">{c}</span>)}
            {inf.creator_type && <span className="rounded-full bg-muted px-2 py-0.5">{inf.creator_type}</span>}
            {inf.gender && <span className="rounded-full bg-muted px-2 py-0.5">{inf.gender}</span>}
            {(inf.countries ?? []).map((c) => <span key={c} className="rounded-full bg-muted px-2 py-0.5">{c}</span>)}
          </div>

          {!inviteOpen ? (
            <button type="button" onClick={() => setInviteOpen(true)} className="mt-1 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-foreground text-sm font-bold text-background">
              <Send className="size-4" /> 캠페인 제안하기
            </button>
          ) : (
            <div className="grid gap-2.5 rounded-xl border border-border p-3">
              <div className="text-[13px] font-semibold">어떤 캠페인으로 초대할까요?</div>
              {campaigns.length === 0 ? (
                <p className="text-xs text-muted-foreground">진행 중인 캠페인이 없어요. 먼저 캠페인을 열어주세요.</p>
              ) : (
                <div className="grid gap-1.5">
                  {campaigns.map((c) => {
                    const st = pairState(c.id);
                    const disabled = st !== "ok";
                    return (
                      <button key={c.id} type="button" disabled={disabled} onClick={() => setCampaignId(c.id)}
                        className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm", campaignId === c.id ? "border-foreground bg-accent" : "border-border", disabled && "opacity-50")}>
                        <span className="truncate">{c.goal ?? "캠페인"}</span>
                        {st === "ok" ? (campaignId === c.id && <Check className="size-4 shrink-0" />) : (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{st === "invited" ? "초대함" : "지원 중"}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="메시지(선택) — 왜 이 크리에이터를 초대하는지" className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40" />
              {error && <p className="text-[12px] text-destructive">{error}</p>}
              <button type="button" disabled={!campaignId || sending} onClick={send} className="inline-flex h-10 w-full items-center justify-center rounded-full bg-foreground text-sm font-bold text-background disabled:bg-muted disabled:text-muted-foreground">
                {sending ? "보내는 중…" : "제안 보내기"}
              </button>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
