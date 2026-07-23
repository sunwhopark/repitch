"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, LogOut, Sparkles, BadgeCheck, RefreshCw, Link2Off } from "lucide-react";
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

type Channel = {
  platform: string;
  handle: string;
  follower_count: number | null;
  avg_views: number | null;
  verified?: boolean;
  verified_at?: string;
  channel_id?: string;
  title?: string;
  ig_user_id?: string;
};

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

  // YouTube 채널 검증(Data API). 성공 시 지표 자동 채움 + verified.
  const [verifyingIdx, setVerifyingIdx] = useState<number | null>(null);
  const [verifyErr, setVerifyErr] = useState<Record<number, string>>({});
  async function verifyYt(i: number) {
    const ch = channels[i];
    if (!ch.handle.trim()) return;
    setVerifyingIdx(i);
    setVerifyErr((e) => ({ ...e, [i]: "" }));
    try {
      const res = await fetch("/api/channels/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: ch.handle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setVerifyErr((e) => ({ ...e, [i]: data.error ?? "확인에 실패했어요." })); setVerifyingIdx(null); return; }
      setCh(i, {
        follower_count: data.subscribers,
        avg_views: data.avgViews,
        verified: true,
        verified_at: new Date().toISOString(),
        channel_id: data.channelId,
        title: data.title,
      });
    } catch {
      setVerifyErr((e) => ({ ...e, [i]: "네트워크 오류. 다시 시도해 주세요." }));
    }
    setVerifyingIdx(null);
  }

  // Instagram 계정 연동(OAuth). authorize 라우트로 풀페이지 이동 → 콜백이 /me?ig=…로 복귀.
  const [igMsg, setIgMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [igBusyIdx, setIgBusyIdx] = useState<number | null>(null);
  useEffect(() => {
    const ig = new URLSearchParams(window.location.search).get("ig");
    if (!ig) return;
    const map: Record<string, { kind: "ok" | "err"; text: string }> = {
      connected: { kind: "ok", text: "Instagram 계정이 연동됐어요." },
      denied: { kind: "err", text: "연동이 취소됐어요." },
      error: { kind: "err", text: "연동에 실패했어요. 다시 시도해 주세요." },
      unconfigured: { kind: "err", text: "Instagram 연동이 설정되지 않았어요. (서버 키 없음)" },
    };
    if (map[ig]) setIgMsg(map[ig]);
    // URL 정리(뒤로가기/새로고침 시 재노출 방지)
    window.history.replaceState({}, "", "/me");
  }, []);

  function connectIg() {
    window.location.href = "/api/channels/instagram/authorize";
  }
  async function refreshIg(i: number) {
    setIgBusyIdx(i);
    setVerifyErr((e) => ({ ...e, [i]: "" }));
    try {
      const res = await fetch("/api/channels/instagram/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setVerifyErr((e) => ({ ...e, [i]: data.error ?? "새로고침에 실패했어요." })); setIgBusyIdx(null); return; }
      setCh(i, { handle: data.username ?? channels[i].handle, follower_count: data.followers, avg_views: data.avgViews, verified: true, verified_at: new Date().toISOString() });
    } catch {
      setVerifyErr((e) => ({ ...e, [i]: "네트워크 오류. 다시 시도해 주세요." }));
    }
    setIgBusyIdx(null);
  }
  async function disconnectIg(i: number) {
    setIgBusyIdx(i);
    try {
      await fetch("/api/channels/instagram/disconnect", { method: "POST" });
      setCh(i, { follower_count: null, avg_views: null, verified: false, verified_at: undefined, ig_user_id: undefined });
    } catch { /* noop */ }
    setIgBusyIdx(null);
  }

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

      {igMsg && (
        <div className={cn("mt-4 rounded-xl border px-4 py-2.5 text-[13px]", igMsg.kind === "ok" ? "border-border bg-card" : "border-destructive/40 bg-destructive/5 text-destructive")}>
          {igMsg.text}
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
            {channels.map((ch, i) => {
              const isYT = ch.platform === "youtube";
              const isIG = ch.platform === "instagram";
              return (
                <div key={i} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <select value={ch.platform} onChange={(e) => setCh(i, { platform: e.target.value, verified: false, verified_at: undefined, channel_id: undefined, title: undefined })} className="h-9 rounded-lg border border-border bg-transparent px-2 text-sm outline-none">
                      {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
                    </select>
                    <Input value={ch.handle} onChange={(e) => setCh(i, { handle: e.target.value, verified: false })} placeholder={isYT ? "@핸들 · URL · 채널ID" : "@핸들"} className="h-9 flex-1 rounded-lg" />
                    <button type="button" onClick={() => rmCh(i)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                  </div>

                  {isYT && ch.verified ? (
                    // 검증됨 — Data API 지표(자동)
                    <div className="mt-2 rounded-lg bg-muted/40 p-2.5">
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="size-4 text-foreground" />
                        <span className="text-sm font-semibold">{ch.title}</span>
                        <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">채널 인증</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground tabular-nums">
                        <span>구독자 {ch.follower_count?.toLocaleString() ?? "비공개"}</span>
                        <span>평균 조회수 {ch.avg_views?.toLocaleString() ?? "—"}</span>
                      </div>
                      <button type="button" disabled={verifyingIdx === i} onClick={() => verifyYt(i)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground underline underline-offset-2">
                        <RefreshCw className={cn("size-3", verifyingIdx === i && "animate-spin")} /> 지표 새로고침
                      </button>
                    </div>
                  ) : isYT ? (
                    // 미검증 YT — 채널 확인 유도
                    <div className="mt-2">
                      <button type="button" disabled={verifyingIdx === i || !ch.handle.trim()} onClick={() => verifyYt(i)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-bold text-background disabled:bg-muted disabled:text-muted-foreground">
                        {verifyingIdx === i ? "확인 중…" : "채널 확인"}
                      </button>
                      {verifyErr[i] && <p className="mt-1.5 text-[11px] text-destructive">{verifyErr[i]}</p>}
                      <p className="mt-1.5 text-[11px] text-muted-foreground">YouTube 채널을 확인하면 구독자·평균 조회수가 자동으로 채워지고 인증 뱃지가 붙어요.</p>
                    </div>
                  ) : isIG && ch.verified ? (
                    // Instagram 연동됨 — Graph API 지표(자동)
                    <div className="mt-2 rounded-lg bg-muted/40 p-2.5">
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="size-4 text-foreground" />
                        <span className="text-sm font-semibold">@{ch.handle}</span>
                        <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">계정 인증</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground tabular-nums">
                        <span>팔로워 {ch.follower_count?.toLocaleString() ?? "—"}</span>
                        <span>평균 조회수 {ch.avg_views?.toLocaleString() ?? "—"}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <button type="button" disabled={igBusyIdx === i} onClick={() => refreshIg(i)} className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground underline underline-offset-2">
                          <RefreshCw className={cn("size-3", igBusyIdx === i && "animate-spin")} /> 지표 새로고침
                        </button>
                        <button type="button" disabled={igBusyIdx === i} onClick={() => disconnectIg(i)} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                          <Link2Off className="size-3" /> 연동 해제
                        </button>
                      </div>
                      {verifyErr[i] && <p className="mt-1.5 text-[11px] text-destructive">{verifyErr[i]}</p>}
                    </div>
                  ) : isIG ? (
                    // 미연동 IG — 계정 연동 유도 + 수동 입력 폴백
                    <div className="mt-2">
                      <button type="button" onClick={connectIg} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-bold text-background">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5" aria-hidden>
                          <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                          <circle cx="12" cy="12" r="4.2" />
                          <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
                        </svg>
                        Instagram 계정 연동
                      </button>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">비즈니스·크리에이터 계정을 연동하면 팔로워·평균 조회수가 자동으로 채워지고 인증 뱃지가 붙어요.</p>
                      <div className="mt-2 flex gap-2">
                        <Input type="number" inputMode="numeric" value={ch.follower_count ?? ""} onChange={(e) => setCh(i, { follower_count: e.target.value ? Number(e.target.value) : null })} placeholder="팔로워" className="h-9 rounded-lg" />
                        <Input type="number" inputMode="numeric" value={ch.avg_views ?? ""} onChange={(e) => setCh(i, { avg_views: e.target.value ? Number(e.target.value) : null })} placeholder="평균 조회수" className="h-9 rounded-lg" />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">또는 본인 입력 · 연동 시 자동 검증돼요.</p>
                    </div>
                  ) : (
                    // 틱톡 — 수동 입력(본인 입력)
                    <>
                      <div className="mt-2 flex gap-2">
                        <Input type="number" inputMode="numeric" value={ch.follower_count ?? ""} onChange={(e) => setCh(i, { follower_count: e.target.value ? Number(e.target.value) : null })} placeholder="팔로워" className="h-9 rounded-lg" />
                        <Input type="number" inputMode="numeric" value={ch.avg_views ?? ""} onChange={(e) => setCh(i, { avg_views: e.target.value ? Number(e.target.value) : null })} placeholder="평균 조회수" className="h-9 rounded-lg" />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">본인 입력 · 자동 검증은 YouTube·Instagram만 지원해요.</p>
                    </>
                  )}
                </div>
              );
            })}
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
