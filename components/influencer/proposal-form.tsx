"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BRAND_CATEGORIES } from "@/lib/brand-application-options";
import { CONSENT_THIRD_PARTY, LEGAL_ROUTES } from "@/lib/legal";
import type { InfluencerProfile } from "@/components/influencer/types";

// 온보딩 폼 상수 재사용(모듈 미export이라 값 복사).
const RANGE = ["1천 미만", "1천-1만", "1만-10만", "10만 이상"];
const COLLAB = ["0회", "1-3회", "4-6회", "7-10회", "10회 이상"];
const CONTENT_TYPES = ["숏폼", "게시물", "스토리", "롱폼", "기타 : 직접 입력"];
const CONTENT_OTHER = "기타 : 직접 입력";
const TONES = ["정보", "유머", "일상", "기타: 직접 입력"];
const TONE_OTHER = "기타: 직접 입력";
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

function uploadOptions(): string[] {
  const out: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${WEEKDAY[d.getDay()]})`);
  }
  return out;
}

export type ProposalContext = {
  targetType: "campaign" | "product";
  campaignId: string | null;
  productId: string | null;
  applicationId: string | null;
  brandName: string | null;
  productName: string | null;
  imageUrl: string | null;
  ship: { recipient: string | null; phone: string | null; address: string | null } | null;
};

function Sel({ label, value, options, onChange, placeholder = "선택" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[13px]">{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:border-foreground/40">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")}>{label}</button>;
}

export function ProposalForm({ ctx, profile, email }: { ctx: ProposalContext; profile: InfluencerProfile; email: string | undefined }) {
  const router = useRouter();
  const ch0 = profile.channels?.[0];
  const uploads = useMemo(uploadOptions, []);

  const [platform, setPlatform] = useState<"instagram" | "youtube">(ch0?.platform === "youtube" ? "youtube" : "instagram");
  const [profileName, setProfileName] = useState(ch0?.handle ?? profile.display_name ?? "");
  const [profileCount, setProfileCount] = useState(ch0?.follower_count != null ? String(ch0.follower_count) : "");
  const [avgLikes, setAvgLikes] = useState("");
  const [avgSaves, setAvgSaves] = useState("");
  const [avgShares, setAvgShares] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [peakViews, setPeakViews] = useState("");
  const [collab, setCollab] = useState("");
  const [categories, setCategories] = useState<string[]>(profile.category?.slice(0, 2) ?? []);
  const [story, setStory] = useState("");
  const [ct, setCt] = useState<Record<string, { on: boolean; count: number }>>(Object.fromEntries(CONTENT_TYPES.map((l) => [l, { on: false, count: 0 }])));
  const [ctOther, setCtOther] = useState("");
  const [tone, setTone] = useState("");
  const [toneOther, setToneOther] = useState("");
  const [price, setPrice] = useState("");
  const [reuse, setReuse] = useState<boolean | null>(null);
  const [uploadDate, setUploadDate] = useState(uploads[0]);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isIG = platform === "instagram";
  const toInt = (s: string) => { const n = parseInt(s.replace(/\D/g, ""), 10); return Number.isNaN(n) ? null : n; };
  const toggleCat = (c: string) => setCategories((p) => (p.includes(c) ? p.filter((x) => x !== c) : p.length >= 2 ? p : [...p, c]));
  const setCtOn = (l: string, on: boolean) => setCt((p) => ({ ...p, [l]: { on, count: on ? Math.max(1, p[l].count) : 0 } }));
  const setCtN = (l: string, d: number) => setCt((p) => ({ ...p, [l]: { on: p[l].on, count: Math.max(1, p[l].count + d) } }));

  const contentPayload = CONTENT_TYPES.filter((l) => ct[l].on && ct[l].count > 0).map((l) => ({ label: l, count: ct[l].count }));
  const metricsOk = isIG ? avgLikes && avgShares && collab : avgViews && peakViews.trim() && collab;
  const canSubmit =
    profileName.trim() && profileCount.trim() && categories.length > 0 && metricsOk &&
    story.trim() && contentPayload.length > 0 && (!ct[CONTENT_OTHER].on || ctOther.trim()) &&
    tone && (tone !== TONE_OTHER || toneOther.trim()) &&
    price.trim() && reuse !== null && uploadDate && consent;

  async function submit() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: inserted, error: e } = await supabase.from("proposal_submissions").insert({
      brand_name: ctx.brandName ?? "",
      product_name: ctx.productName ?? "",
      platform,
      profile_name: profileName.trim(),
      profile_count: toInt(profileCount) ?? 0,
      selected_categories: categories,
      avg_likes: isIG ? avgLikes || null : null,
      avg_saves: isIG ? avgSaves || null : null,
      avg_shares: isIG ? avgShares || null : null,
      avg_views: !isIG ? avgViews || null : null,
      peak_views: !isIG ? toInt(peakViews) : null,
      collab_count: collab,
      story_text: story.trim(),
      content_types: contentPayload,
      content_type_other: ct[CONTENT_OTHER].on ? ctOther.trim() || null : null,
      content_tone: tone,
      content_tone_other: tone === TONE_OTHER ? toneOther.trim() || null : null,
      expected_price: toInt(price) ?? 0,
      reuse_allowed: reuse ?? false,
      upload_date: uploadDate || null,
      contact_email: email ?? "",
      privacy_consent: true,
      third_party_consent: true,
      consent_at: new Date().toISOString(),
      influencer_id: profile.id,
      target_type: ctx.targetType,
      campaign_id: ctx.campaignId,
      product_id: ctx.productId,
      application_id: ctx.applicationId,
      ship_recipient: ctx.ship?.recipient ?? null,
      ship_phone: ctx.ship?.phone ?? null,
      ship_address: ctx.ship?.address ?? null,
    }).select("id").single();
    setSaving(false);
    if (e) { setError("제출에 실패했어요. 잠시 후 다시 시도해 주세요."); return; }
    // 진정성 평가 자동 트리거(비동기 fire-and-forget) — 실패해도 제출은 성공 처리.
    // 결과는 브랜드 인박스에서 표시되며, 실패 시 인박스의 [분석 실행]으로 재시도.
    if (inserted?.id) {
      fetch("/api/proposals/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: inserted.id }),
      }).catch(() => {});
    }
    router.push("/my?tab=proposals");
    router.refresh();
  }

  return (
    <div className="pb-4">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> 뒤로</button>
      <h1 className="mt-3 text-xl font-bold tracking-tight">역제안서 작성</h1>

      {/* 컨텍스트 카드 (상단 고정 느낌) */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {ctx.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ctx.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-6" /></div>}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">{ctx.targetType === "campaign" ? "체험 캠페인에 보내는 제안" : "입점 제품에 보내는 제안"}</div>
          <div className="truncate text-sm font-semibold">{ctx.productName}</div>
          <div className="text-xs text-muted-foreground">{ctx.brandName}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-6">
        {/* 채널 */}
        <div className="grid gap-3">
          <div className="text-sm font-semibold">내 채널 <span className="text-[11px] font-normal text-muted-foreground">프로필에서 자동 입력 · 수정 가능</span></div>
          <div className="flex rounded-full border border-border p-0.5">
            {(["instagram", "youtube"] as const).map((pf) => (
              <button key={pf} type="button" onClick={() => setPlatform(pf)} className={cn("flex-1 rounded-full py-1.5 text-sm font-medium", platform === pf ? "bg-foreground text-background" : "text-muted-foreground")}>{pf === "instagram" ? "Instagram" : "YouTube"}</button>
            ))}
          </div>
          <div className="grid gap-1.5"><Label className="text-[13px]">{isIG ? "계정명" : "채널명"}</Label><Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="rounded-xl" /></div>
          <div className="grid gap-1.5"><Label className="text-[13px]">{isIG ? "팔로워 수" : "구독자 수"}</Label><Input type="number" inputMode="numeric" value={profileCount} onChange={(e) => setProfileCount(e.target.value)} className="rounded-xl" /></div>
        </div>

        {/* 지표 */}
        <div className="grid gap-3">
          <div className="text-sm font-semibold">채널 지표</div>
          {isIG ? (
            <>
              <Sel label="평균 좋아요 수" value={avgLikes} options={RANGE} onChange={setAvgLikes} />
              <Sel label="평균 저장 수 (선택)" value={avgSaves} options={RANGE} onChange={setAvgSaves} />
              <Sel label="평균 공유 수" value={avgShares} options={RANGE} onChange={setAvgShares} />
            </>
          ) : (
            <>
              <Sel label="최근 3개 콘텐츠 평균 조회수" value={avgViews} options={RANGE} onChange={setAvgViews} />
              <div className="grid gap-1.5"><Label className="text-[13px]">가장 높은 조회수</Label><Input type="number" inputMode="numeric" value={peakViews} onChange={(e) => setPeakViews(e.target.value)} placeholder="예: 120000" className="rounded-xl" /></div>
            </>
          )}
          <Sel label="최근 3개월 브랜드 협업 횟수" value={collab} options={COLLAB} onChange={setCollab} />
        </div>

        {/* 카테고리 */}
        <div className="grid gap-2">
          <Label className="text-[13px]">카테고리 <span className="text-[11px] text-muted-foreground">최대 2개</span></Label>
          <div className="flex flex-wrap gap-2">{BRAND_CATEGORIES.map((c) => <Chip key={c} label={c} active={categories.includes(c)} onClick={() => toggleCat(c)} />)}</div>
        </div>

        {/* 서사 */}
        <div className="grid gap-2">
          <Label className="text-[13px]">이 제품을 어떻게 써봤나요?</Label>
          <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={5} placeholder="실사용 경험·느낀 점을 구체적으로 적을수록 제안이 강해져요." className="rounded-xl border border-border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus:border-foreground/40" />
        </div>

        {/* 콘텐츠 형태 */}
        <div className="grid gap-2">
          <Label className="text-[13px]">제안할 콘텐츠</Label>
          <div className="grid gap-2">
            {CONTENT_TYPES.map((l) => (
              <div key={l} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ct[l].on} onChange={(e) => setCtOn(l, e.target.checked)} className="size-4 accent-foreground" />
                  {l}
                </label>
                {ct[l].on && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCtN(l, -1)} className="rounded-md border border-border p-1"><Minus className="size-3.5" /></button>
                    <span className="w-5 text-center text-sm tabular-nums">{ct[l].count}</span>
                    <button type="button" onClick={() => setCtN(l, 1)} className="rounded-md border border-border p-1"><Plus className="size-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
            {ct[CONTENT_OTHER].on && <Input value={ctOther} onChange={(e) => setCtOther(e.target.value)} placeholder="어떤 콘텐츠인가요?" className="rounded-xl" />}
          </div>
        </div>

        <Sel label="콘텐츠 톤" value={tone} options={TONES} onChange={setTone} />
        {tone === TONE_OTHER && <Input value={toneOther} onChange={(e) => setToneOther(e.target.value)} placeholder="톤을 알려주세요" className="rounded-xl" />}

        {/* 단가·재사용·일정 */}
        <div className="grid gap-1.5"><Label className="text-[13px]">희망 단가 (만원)</Label><Input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="예: 30" className="rounded-xl" /></div>
        <div className="grid gap-2">
          <Label className="text-[13px]">2차 활용(브랜드 재게시) 허용</Label>
          <div className="flex gap-2">
            {([["예", true], ["아니오", false]] as const).map(([l, v]) => <Chip key={l} label={l} active={reuse === v} onClick={() => setReuse(v)} />)}
          </div>
        </div>
        <Sel label="희망 게시 시작일" value={uploadDate} options={uploads} onChange={setUploadDate} placeholder="날짜 선택" />

        {/* 제3자 동의 재확인 */}
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3.5">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-foreground" />
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">(필수)</span> {CONSENT_THIRD_PARTY.body}{" "}
            <a href={LEGAL_ROUTES.privacy} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-2" onClick={(e) => e.stopPropagation()}>[개인정보 처리방침]</a>
          </span>
        </label>

        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <Button type="button" disabled={!canSubmit || saving} onClick={submit} className="h-12 w-full rounded-full font-bold">{saving ? "제출 중…" : "역제안 보내기"}</Button>
      </div>
    </div>
  );
}
