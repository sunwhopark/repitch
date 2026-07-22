"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BRAND_CATEGORIES } from "@/lib/brand-application-options";
import { DEFAULT_WEIGHTS, type ScoreWeights } from "@/lib/scoring";
import { recommendedWeights } from "@/lib/scoring/recommended-weights";

export type BrandProfile = {
  id: string;
  brand_name: string | null;
  category: string | null;
  contact_name: string | null;
  pref_creator_type: string | null;
  pref_creator_gender: string | null;
  target_countries: string[] | null;
  approved: boolean;
  weights?: ScoreWeights | null;
};

const AXES: { key: keyof ScoreWeights; label: string; desc: string }[] = [
  { key: "fit", label: "적합도", desc: "카테고리·타겟·단가가 브랜드와 맞는지" },
  { key: "quality", label: "크리에이터 역량", desc: "성과 효율·팔로워 반응·성장세" },
  { key: "auth", label: "진정성", desc: "실사용 기간·서사·채널과의 어울림" },
];

const CREATOR_TYPES = ["실물", "버추얼", "상관없음"];
const GENDERS = ["여성", "남성", "상관없음"];
const COUNTRIES = ["대한민국", "미국", "일본"];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

// 설정 → 브랜드 프로필 편집. brands 행 update(본인만, RLS). approved는 서버 트리거가
// 잠가서 여기서 바뀌지 않음.
export function ProfileEditModal({
  open,
  onOpenChange,
  brand,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brand: BrandProfile;
}) {
  const router = useRouter();
  const [brandName, setBrandName] = useState(brand.brand_name ?? "");
  const [contactName, setContactName] = useState(brand.contact_name ?? "");
  const [category, setCategory] = useState(brand.category ?? "");
  const [creatorType, setCreatorType] = useState(brand.pref_creator_type ?? "");
  const [gender, setGender] = useState(brand.pref_creator_gender ?? "");
  const [countries, setCountries] = useState<string[]>(brand.target_countries ?? []);
  const [weights, setWeights] = useState<ScoreWeights>(brand.weights ?? DEFAULT_WEIGHTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setBrandName(brand.brand_name ?? "");
      setContactName(brand.contact_name ?? "");
      setCategory(brand.category ?? "");
      setCreatorType(brand.pref_creator_type ?? "");
      setGender(brand.pref_creator_gender ?? "");
      setCountries(brand.target_countries ?? []);
      setWeights(brand.weights ?? DEFAULT_WEIGHTS);
      setError("");
    }
  }, [open, brand]);

  function toggleCountry(c: string) {
    setCountries((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  const wSum = weights.fit + weights.quality + weights.auth;
  const rec = recommendedWeights(category);
  const setW = (key: keyof ScoreWeights, v: number) => setWeights((w) => ({ ...w, [key]: Math.max(0, Math.min(100, v || 0)) }));

  async function save() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("brands")
      .update({
        brand_name: brandName.trim(),
        contact_name: contactName.trim(),
        category: category || null,
        pref_creator_type: creatorType || null,
        pref_creator_gender: gender || null,
        target_countries: countries,
        weights,
      })
      .eq("id", brand.id);
    if (error) {
      setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
      return;
    }
    onOpenChange(false);
    router.refresh(); // 사이드바 프로필 카드 즉시 반영
    setSaving(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md md:rounded-2xl">
        <ModalHeader className="text-left">
          <ModalTitle className="text-lg font-semibold">브랜드 프로필</ModalTitle>
        </ModalHeader>
        <ModalBody className="max-h-[62vh] space-y-5 overflow-y-auto px-4 pb-6 md:px-6">
          <div className="grid gap-2">
            <Label className="text-[13px]">브랜드명</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label className="text-[13px]">담당자명</Label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label className="text-[13px]">주요 제품 카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {BRAND_CATEGORIES.map((c) => <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-[13px]">선호 크리에이터 유형</Label>
            <div className="flex flex-wrap gap-2">
              {CREATOR_TYPES.map((c) => <Chip key={c} label={c} active={creatorType === c} onClick={() => setCreatorType(c)} />)}
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-[13px]">선호 크리에이터 성별</Label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => <Chip key={g} label={g} active={gender === g} onClick={() => setGender(g)} />)}
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-[13px]">타겟 국가 <span className="text-[11px] text-muted-foreground">복수 선택</span></Label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => <Chip key={c} label={c} active={countries.includes(c)} onClick={() => toggleCountry(c)} />)}
            </div>
          </div>

          {/* 평가 가중치 */}
          <div className="grid gap-2 border-t border-border pt-5">
            <div className="flex items-baseline justify-between">
              <Label className="text-[13px]">평가 가중치</Label>
              <span className={cn("text-[11px] tabular-nums", wSum === 100 ? "text-muted-foreground" : "text-destructive")}>합계 {wSum}/100</span>
            </div>
            <p className="text-[11px] text-muted-foreground">종합점수를 낼 때 세 축의 비중이에요. 합이 100이어야 저장돼요.</p>
            <div className="mt-1 grid gap-2.5">
              {AXES.map((a) => (
                <div key={a.key} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{a.label}</div>
                    <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                  </div>
                  <div className="flex shrink-0 items-center rounded-lg border border-border">
                    <button type="button" onClick={() => setW(a.key, weights[a.key] - 5)} className="h-9 w-8 text-muted-foreground hover:text-foreground">−</button>
                    <input
                      type="number"
                      value={weights[a.key]}
                      onChange={(e) => setW(a.key, Number(e.target.value.replace(/[^0-9]/g, "")))}
                      className="h-9 w-12 border-x border-border bg-transparent text-center text-sm tabular-nums outline-none"
                    />
                    <button type="button" onClick={() => setW(a.key, weights[a.key] + 5)} className="h-9 w-8 text-muted-foreground hover:text-foreground">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{category || "기본"} 추천값 {rec.fit}/{rec.quality}/{rec.auth}</span>
              <button type="button" onClick={() => setWeights(rec)} className="font-medium text-foreground underline underline-offset-2">추천값으로 되돌리기</button>
            </div>
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <Button type="button" disabled={saving || wSum !== 100} onClick={save} className="h-11 w-full rounded-full font-bold">
            {saving ? "저장 중…" : wSum !== 100 ? "가중치 합을 100으로 맞춰주세요" : "저장"}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
