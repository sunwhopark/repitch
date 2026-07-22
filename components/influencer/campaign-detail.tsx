"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CONSENT_THIRD_PARTY, LEGAL_ROUTES } from "@/lib/legal";
import { offerLabel, fmtMD, type ActiveCampaign, type InfluencerProfile } from "@/components/influencer/types";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

export function CampaignDetail({
  campaign: c,
  profile,
  loggedIn,
  isInfluencer,
  alreadyApplied,
}: {
  campaign: ActiveCampaign;
  profile: InfluencerProfile | null;
  loggedIn: boolean;
  isInfluencer: boolean;
  alreadyApplied: boolean;
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [recipient, setRecipient] = useState(profile?.ship_recipient ?? "");
  const [phone, setPhone] = useState(profile?.ship_phone ?? "");
  const [address, setAddress] = useState(profile?.ship_address ?? "");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = recipient.trim() !== "" && phone.trim() !== "" && address.trim() !== "" && consent;

  async function apply() {
    if (!profile) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase.from("campaign_applications").insert({
      campaign_id: c.id,
      influencer_id: profile.id,
      ship_recipient: recipient.trim(),
      ship_phone: phone.trim(),
      ship_address: address.trim(),
      third_party_consent_at: new Date().toISOString(),
    });
    setSaving(false);
    if (e) {
      setError(e.code === "23505" ? "이미 지원한 캠페인이에요." : "지원에 실패했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setSheetOpen(false);
    router.push("/my");
    router.refresh();
  }

  const platforms = (c.platforms ?? "").split(",").map((s) => s.trim()).filter(Boolean).filter((p) => p !== "상관없음");

  return (
    <div className="pb-4">
      <button type="button" onClick={() => router.push("/campaigns")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> 캠페인
      </button>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[16/10] w-full bg-muted">
          {c.product_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.product_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-10" /></div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2">
            {c.product_category && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{c.product_category}</span>}
            <span className="text-xs text-muted-foreground">{c.brand_name}</span>
          </div>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight">{c.product_name ?? c.goal ?? "캠페인"}</h1>
          <div className="mt-1.5 text-sm font-medium">{offerLabel(c.offer_type, c.deal_mode, c.deal_value)} · {c.quantity ?? 1}개</div>

          <div className="mt-4">
            <Info label="캠페인 목표" value={c.goal} />
            <Info label="콘텐츠 형태" value={c.content_types?.length ? c.content_types.join(", ") : null} />
            <Info label="원하는 인플루언서" value={[c.styles?.join(", "), c.desired_vibe].filter(Boolean).join(" · ") || null} />
            <Info label="선호 플랫폼" value={platforms.length ? platforms.join(", ") : null} />
            <Info label="체험 기간" value={c.trial_weeks ? `${c.trial_weeks}주` : null} />
            <Info label="모집 기간" value={c.recruit_start ? `${fmtMD(c.recruit_start)} – ${fmtMD(c.recruit_end)}` : null} />
            <Info label="희망 게시 시작" value={c.post_date_tbd ? "협의 후 결정" : fmtMD(c.desired_post_date) || null} />
          </div>
        </div>
      </div>

      {/* 지원 CTA */}
      <div className="sticky bottom-20 mt-4 md:bottom-4">
        {!loggedIn ? (
          <Button type="button" onClick={() => router.push("/login")} className="h-12 w-full rounded-full font-bold">로그인하고 지원하기</Button>
        ) : !isInfluencer ? (
          <div className="rounded-full border border-border px-4 py-3 text-center text-sm text-muted-foreground">인플루언서 계정으로 지원할 수 있어요</div>
        ) : alreadyApplied ? (
          <Button type="button" variant="outline" onClick={() => router.push("/my")} className="h-12 w-full rounded-full font-bold">지원 완료 · 내 활동에서 보기</Button>
        ) : (
          <Button type="button" onClick={() => setSheetOpen(true)} className="h-12 w-full rounded-full font-bold">지원하기</Button>
        )}
      </div>

      {/* 지원 확인 시트 */}
      <Modal open={sheetOpen} onOpenChange={setSheetOpen}>
        <ModalContent className="md:max-w-md md:rounded-2xl">
          <ModalHeader className="text-left">
            <ModalTitle className="text-lg font-semibold">캠페인 지원</ModalTitle>
          </ModalHeader>
          <ModalBody className="max-h-[70vh] space-y-4 overflow-y-auto px-4 pb-6 md:px-6">
            <p className="text-[13px] text-muted-foreground">배송지는 선정 시 제품 발송에 쓰여요. 프로필 정보가 자동으로 채워졌어요.</p>
            <div className="grid gap-2"><Label className="text-[13px]">수령인</Label><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="이름" className="rounded-xl" /></div>
            <div className="grid gap-2"><Label className="text-[13px]">연락처</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="rounded-xl" /></div>
            <div className="grid gap-2"><Label className="text-[13px]">배송지 주소</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" className="rounded-xl" /></div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3.5">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-foreground" />
              <span className="text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">(필수)</span> {CONSENT_THIRD_PARTY.body}{" "}
                <a href={LEGAL_ROUTES.privacy} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-2" onClick={(e) => e.stopPropagation()}>[개인정보 처리방침]</a>
              </span>
            </label>

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <Button type="button" disabled={!canSubmit || saving} onClick={apply} className="h-11 w-full rounded-full font-bold">
              {saving ? "지원 중…" : "지원 제출"}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
