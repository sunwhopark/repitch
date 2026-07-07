"use client";
import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { OnboardingModal } from "@/components/ui/onboarding-modal";

// Brand matching filters (hard filters 4·5 from the eval spec). Held in memory
// (demo) and consumed by the inbox later.
export type DashboardFilters = {
  creatorType: string; // 실물 | 버추얼 | 상관없음
  gender: string; // 여성 | 남성 | 상관없음
  countries: string[]; // subset of [대한민국, 미국, 일본] or ["상관없음"]
};

export const DEFAULT_FILTERS: DashboardFilters = {
  creatorType: "상관없음",
  gender: "상관없음",
  countries: ["상관없음"],
};

const CREATOR_TYPES = ["실물", "버추얼", "상관없음"];
const GENDERS = ["여성", "남성", "상관없음"];
const COUNTRIES = ["대한민국", "미국", "일본", "상관없음"];

function ChipGroup({
  label,
  options,
  isSelected,
  onToggle,
}: {
  label: string;
  options: string[];
  isSelected: (o: string) => boolean;
  onToggle: (o: string) => void;
}) {
  return (
    <div className="category-section">
      <span className="section-title">{label}</span>
      <div className="category-grid">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`category-button ${
              isSelected(o) ? "category-button-selected" : ""
            }`}
            onClick={() => onToggle(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterModal({
  open,
  initial,
  onSkip,
  onComplete,
}: {
  open: boolean;
  initial: DashboardFilters;
  onSkip: () => void;
  onComplete: (filters: DashboardFilters) => void;
}) {
  const [creatorType, setCreatorType] = useState(initial.creatorType);
  const [gender, setGender] = useState(initial.gender);
  const [countries, setCountries] = useState<string[]>(initial.countries);

  // Reset to the current saved filters each time the modal opens.
  useEffect(() => {
    if (open) {
      setCreatorType(initial.creatorType);
      setGender(initial.gender);
      setCountries(initial.countries);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleCountry(c: string) {
    setCountries((prev) => {
      if (c === "상관없음") return ["상관없음"];
      const rest = prev.filter((x) => x !== "상관없음");
      if (rest.includes(c)) {
        const next = rest.filter((x) => x !== c);
        return next.length ? next : ["상관없음"];
      }
      return [...rest, c];
    });
  }

  return (
    <OnboardingModal open={open} onClose={onSkip} ariaLabel="브랜드 필터 설정">
      <section className="mobile-screen" style={{ justifyContent: "center" }}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <SlidersHorizontal size={30} strokeWidth={1.75} />
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--black)" }}>
                브랜드 필터 설정
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--gray-400)" }}>
                매칭받을 크리에이터 조건을 골라주세요
              </p>
            </div>
          </div>

          <ChipGroup
            label="크리에이터 유형"
            options={CREATOR_TYPES}
            isSelected={(o) => creatorType === o}
            onToggle={setCreatorType}
          />
          <ChipGroup
            label="크리에이터 성별"
            options={GENDERS}
            isSelected={(o) => gender === o}
            onToggle={setGender}
          />
          <ChipGroup
            label="타겟 국가"
            options={COUNTRIES}
            isSelected={(o) => countries.includes(o)}
            onToggle={toggleCountry}
          />

          <button
            className="next-button"
            type="button"
            onClick={() => onComplete({ creatorType, gender, countries })}
          >
            설정 완료
          </button>
          <button className="restart-button" type="button" onClick={onSkip}>
            나중에 설정
          </button>
        </div>
      </section>
    </OnboardingModal>
  );
}
