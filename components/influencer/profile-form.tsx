"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BRAND_CATEGORIES } from "@/lib/brand-application-options";
import type { InfluencerProfile } from "@/components/influencer/types";

const PLATFORMS = ["instagram", "youtube", "tiktok"];
const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", youtube: "YouTube", tiktok: "틱톡" };
const CREATOR_TYPES = ["실물", "버추얼"];
const GENDERS = ["여성", "남성"];
const COUNTRIES = ["대한민국", "미국", "일본"];

type Channel = { platform: string; handle: string; follower_count: number | null; avg_views: number | null };

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")}>
      {label}
    </button>
  );
}

export function ProfileForm({ profile }: { profile: InfluencerProfile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [channels, setChannels] = useState<Channel[]>(profile.channels?.length ? profile.channels : []);
  const [category, setCategory] = useState<string[]>(profile.category ?? []);
  const [creatorType, setCreatorType] = useState(profile.creator_type ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [countries, setCountries] = useState<string[]>(profile.countries ?? []);
  const [recipient, setRecipient] = useState(profile.ship_recipient ?? "");
  const [phone, setPhone] = useState(profile.ship_phone ?? "");
  const [address, setAddress] = useState(profile.ship_address ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const incomplete = channels.length === 0 || category.length === 0;

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const addChannel = () => setChannels((c) => [...c, { platform: "instagram", handle: "", follower_count: null, avg_views: null }]);
  const setCh = (i: number, patch: Partial<Channel>) => setChannels((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const rmCh = (i: number) => setChannels((c) => c.filter((_, idx) => idx !== i));

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    const supabase = createClient();
    const { error: e } = await supabase
      .from("influencers")
      .update({
        display_name: displayName.trim() || null,
        channels: channels.filter((c) => c.handle.trim()),
        category,
        creator_type: creatorType || null,
        gender: gender || null,
        countries,
        ship_recipient: recipient.trim() || null,
        ship_phone: phone.trim() || null,
        ship_address: address.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (e) { setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요."); return; }
    setSaved(true);
    router.refresh();
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">프로필</h1>
        <button type="button" onClick={logout} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
          <LogOut className="size-4" /> 로그아웃
        </button>
      </div>

      {incomplete && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-sm font-semibold">프로필을 완성해 주세요</div>
            <div className="text-xs text-muted-foreground">채널·카테고리를 등록하면 브랜드가 회원님을 찾기 쉬워져요. 지금 채우거나 나중에 해도 괜찮아요.</div>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-6">
        <div className="grid gap-2">
          <Label className="text-[13px]">활동명</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="예: 서연뷰티" className="rounded-xl" />
        </div>

        {/* 채널 */}
        <div className="grid gap-2">
          <Label className="text-[13px]">채널 <span className="text-[11px] text-muted-foreground">복수 등록 가능</span></Label>
          <div className="grid gap-2.5">
            {channels.map((ch, i) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <select value={ch.platform} onChange={(e) => setCh(i, { platform: e.target.value })} className="h-9 rounded-lg border border-border bg-transparent px-2 text-sm outline-none">
                    {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
                  </select>
                  <Input value={ch.handle} onChange={(e) => setCh(i, { handle: e.target.value })} placeholder="@핸들" className="h-9 flex-1 rounded-lg" />
                  <button type="button" onClick={() => rmCh(i)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>
                <div className="mt-2 flex gap-2">
                  <Input type="number" inputMode="numeric" value={ch.follower_count ?? ""} onChange={(e) => setCh(i, { follower_count: e.target.value ? Number(e.target.value) : null })} placeholder="팔로워" className="h-9 rounded-lg" />
                  <Input type="number" inputMode="numeric" value={ch.avg_views ?? ""} onChange={(e) => setCh(i, { avg_views: e.target.value ? Number(e.target.value) : null })} placeholder="평균 조회수" className="h-9 rounded-lg" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addChannel} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground">
              <Plus className="size-4" /> 채널 추가
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-[13px]">카테고리 <span className="text-[11px] text-muted-foreground">복수 선택</span></Label>
          <div className="flex flex-wrap gap-2">{BRAND_CATEGORIES.map((c) => <Chip key={c} label={c} active={category.includes(c)} onClick={() => toggle(category, setCategory, c)} />)}</div>
        </div>
        <div className="grid gap-2">
          <Label className="text-[13px]">유형</Label>
          <div className="flex flex-wrap gap-2">{CREATOR_TYPES.map((c) => <Chip key={c} label={c} active={creatorType === c} onClick={() => setCreatorType(c)} />)}</div>
        </div>
        <div className="grid gap-2">
          <Label className="text-[13px]">성별</Label>
          <div className="flex flex-wrap gap-2">{GENDERS.map((g) => <Chip key={g} label={g} active={gender === g} onClick={() => setGender(g)} />)}</div>
        </div>
        <div className="grid gap-2">
          <Label className="text-[13px]">활동 국가 <span className="text-[11px] text-muted-foreground">복수 선택</span></Label>
          <div className="flex flex-wrap gap-2">{COUNTRIES.map((c) => <Chip key={c} label={c} active={countries.includes(c)} onClick={() => toggle(countries, setCountries, c)} />)}</div>
        </div>

        {/* 기본 배송지 */}
        <div className="grid gap-2">
          <Label className="text-[13px]">기본 배송지 <span className="text-[11px] text-muted-foreground">선택 · 지원할 때 자동으로 채워져요</span></Label>
          <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="수령인" className="rounded-xl" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" className="rounded-xl" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" className="rounded-xl" />
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}
        {saved && !error && <p className="text-[13px] text-muted-foreground">저장됐어요.</p>}

        <Button type="button" disabled={saving} onClick={save} className="h-12 w-full rounded-full font-bold">{saving ? "저장 중…" : "저장"}</Button>
      </div>
    </div>
  );
}
