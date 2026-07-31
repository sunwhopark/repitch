"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { offerLabel, type MyInvitationRow } from "@/components/influencer/types";

type Ship = { recipient: string | null; phone: string | null; address: string | null };

export function ReceivedInvitationsList({ rows, ship }: { rows: MyInvitationRow[]; ship: Ship }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  // 수락 = campaign_applications(selected) 즉시 생성(배송지 스냅샷·이 수락이 제3자 동의) + invitation accepted.
  async function accept(row: MyInvitationRow) {
    const id = row.invitation.id;
    setBusyId(id); setError((e) => ({ ...e, [id]: "" }));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusyId(null); return; }
    const now = new Date().toISOString();
    const { error: aErr } = await supabase.from("campaign_applications").upsert({
      campaign_id: row.campaign.campaign_id,
      influencer_id: user.id,
      status: "selected",
      selected_at: now,
      third_party_consent_at: now,
      ship_recipient: ship.recipient,
      ship_phone: ship.phone,
      ship_address: ship.address,
    }, { onConflict: "campaign_id,influencer_id" });
    if (aErr) { setError((e) => ({ ...e, [id]: "수락 처리에 실패했어요. 잠시 후 다시 시도해 주세요." })); setBusyId(null); return; }
    await supabase.from("campaign_invitations").update({ status: "accepted", responded_at: now }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  async function decline(id: string) {
    setBusyId(id);
    const supabase = createClient();
    await supabase.from("campaign_invitations").update({ status: "declined", responded_at: new Date().toISOString() }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  const pending = rows.filter((r) => r.invitation.status === "pending");

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <Mail className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">아직 받은 제안이 없어요.<br />브랜드가 캠페인으로 초대하면 여기에 표시돼요.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {pending.map((row) => {
        const c = row.campaign;
        const id = row.invitation.id;
        return (
          <div key={id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex gap-3 p-4">
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {c.product_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.product_image_url} alt="" className="h-full w-full object-cover" />
                ) : <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-6" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{c.brand_name ?? "브랜드"}</div>
                <div className="truncate text-[13px] text-muted-foreground">{c.product_name ?? c.goal ?? "캠페인"}</div>
                <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                  <span>{offerLabel(c.offer_type, c.deal_mode, c.deal_value)}</span>
                  {c.trial_weeks != null && <span>· 체험 {c.trial_weeks}주</span>}
                </div>
              </div>
            </div>
            {row.invitation.message && (
              <p className="mx-4 mb-3 rounded-lg bg-muted/50 px-3 py-2 text-[13px] text-foreground/80">“{row.invitation.message}”</p>
            )}
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">수락하면 배송을 위해 이름·연락처·주소가 이 브랜드에 제공돼요. 수락은 제3자 제공 동의로 간주돼요.</p>
              {error[id] && <p className="mb-2 text-[12px] text-destructive">{error[id]}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={busyId === id} onClick={() => accept(row)} className="h-10 flex-1 rounded-full bg-foreground text-sm font-bold text-background disabled:opacity-60">
                  {busyId === id ? "처리 중…" : "수락"}
                </button>
                <button type="button" disabled={busyId === id} onClick={() => decline(id)} className="h-10 flex-1 rounded-full border border-border text-sm font-medium hover:bg-accent disabled:opacity-60">거절</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
