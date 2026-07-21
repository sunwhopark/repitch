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

export type BrandProfile = {
  id: string;
  brand_name: string | null;
  category: string | null;
  contact_name: string | null;
  pref_creator_type: string | null;
  pref_creator_gender: string | null;
  target_countries: string[] | null;
  approved: boolean;
};

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
      setError("");
    }
  }, [open, brand]);

  function toggleCountry(c: string) {
    setCountries((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

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

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <Button type="button" disabled={saving} onClick={save} className="h-11 w-full rounded-full font-bold">
            {saving ? "저장 중…" : "저장"}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
