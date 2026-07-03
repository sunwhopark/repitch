"use client";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { OnboardingModal } from "@/components/ui/onboarding-modal";
import { supabase } from "@/lib/supabase/client";
import {
  BRAND_AGE_GROUPS,
  BRAND_CATEGORIES,
  BRAND_GENDERS,
  BRAND_STAGES,
} from "@/lib/brand-application-options";

/**
 * BrandOnboardingModal — brand "사전 입점 신청" lead form.
 *
 * Lead-form only: no password, no Supabase Auth, no business-registration
 * number. Reuses the shared OnboardingModal shell (portal, ESC/overlay/close,
 * focus trap, scroll lock, reduced-motion) and its monotone .onboarding-scope
 * CSS classes, so it matches the influencer onboarding visually.
 *
 * Submission is mocked for now (advances to the completion screen). The real
 * Supabase insert into brand_applications lands in the next step.
 */

const completionLogoUrl = "/repitch_wordmark_alpha.png";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function BrandStepper({ step }: { step: number }) {
  return (
    <div className="stepper">
      <div className="stepper-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`stepper-bar ${
              step === n
                ? "stepper-bar-active"
                : step > n
                  ? "stepper-bar-done"
                  : ""
            }`}
          />
        ))}
      </div>
      <p className="stepper-count">
        <strong>{Math.min(step, 4)}</strong>
        <span>/4</span>
      </p>
    </div>
  );
}

function BrandOnboardingFlow({
  onClose,
  isSaving,
  setIsSaving,
}: {
  onClose: () => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}) {
  const [step, setStep] = useState(1);

  // Step 1 — basics
  const [brandName, setBrandName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerTitle, setManagerTitle] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Step 2 — target & category
  const [category, setCategory] = useState("");
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [gender, setGender] = useState("");

  // Step 3 — optional
  const [brandStage, setBrandStage] = useState("");
  const [message, setMessage] = useState("");

  // Step 4 — terms
  const [termService, setTermService] = useState(false);
  const [termPrivacy, setTermPrivacy] = useState(false);
  const [termBusinessInfo, setTermBusinessInfo] = useState(false);
  const [termMarketing, setTermMarketing] = useState(false);

  const [submitError, setSubmitError] = useState("");

  const agreeAll =
    termService && termPrivacy && termBusinessInfo && termMarketing;

  function toggleAll() {
    const next = !agreeAll;
    setTermService(next);
    setTermPrivacy(next);
    setTermBusinessInfo(next);
    setTermMarketing(next);
  }

  const canStep1 =
    brandName.trim().length > 0 &&
    managerName.trim().length > 0 &&
    managerTitle.trim().length > 0 &&
    isValidEmail(email.trim()) &&
    website.trim().length > 0;
  const canStep2 =
    category !== "" && ageGroups.length > 0 && gender !== "";
  // Required 3 of 4 terms (marketing is optional).
  const canSubmit = termService && termPrivacy && termBusinessInfo;

  function toggleAge(value: string) {
    setAgeGroups((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function goBack() {
    if (isSaving) {
      return;
    }
    setStep((current) => (current > 1 ? current - 1 : 1));
  }

  async function submitApplication() {
    if (!canSubmit || isSaving) {
      return;
    }

    const payload = {
      brand_name: brandName.trim(),
      manager_name: managerName.trim(),
      manager_title: managerTitle.trim(),
      email: email.trim(),
      website: website.trim(),
      category,
      age_groups: ageGroups,
      gender,
      brand_stage: brandStage || null,
      message: message.trim() || null,
      service_terms_consent: termService,
      privacy_consent: termPrivacy,
      business_info_consent: termBusinessInfo,
      marketing_consent: termMarketing,
      consent_at: new Date().toISOString(),
    };

    setIsSaving(true);
    setSubmitError("");
    // No .select() — RLS blocks anon reads, so a select would surface as a
    // false error. We only care whether the insert errored.
    const { error } = await supabase.from("brand_applications").insert(payload);
    setIsSaving(false);

    if (error) {
      setSubmitError("신청에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    setStep(5);
  }

  return (
    <section
      className={`mobile-screen ${step === 5 ? "completion-screen" : ""}`}
      data-name={`입점신청${step}`}
    >
      {step !== 5 && (
        <header className="back-bar" data-name="back-bar">
          <button
            className="back-button"
            type="button"
            aria-label="뒤로 가기"
            onClick={goBack}
          >
            <ChevronLeft size={24} strokeWidth={2.4} />
          </button>
          <BrandStepper step={step} />
        </header>
      )}

      {/* ── Step 1: 기본 정보 ─────────────────────────────── */}
      {step === 1 && (
        <>
          <div className="scroll-area">
            <div className="content">
              <section className="title-block">
                <h1>브랜드 정보를 입력해주세요</h1>
                <p>입점 검토를 위한 기본 정보예요</p>
              </section>

              <label className="field" htmlFor="brand-name">
                <span className="section-title">브랜드명</span>
                <input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="예: 이니스프리"
                  autoComplete="off"
                />
              </label>

              <label className="field" htmlFor="manager-name">
                <span className="section-title">담당자 이름</span>
                <input
                  id="manager-name"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="예: 김리피"
                  autoComplete="off"
                />
              </label>

              <label className="field" htmlFor="manager-title">
                <span className="section-title">담당자 직책</span>
                <input
                  id="manager-title"
                  value={managerTitle}
                  onChange={(e) => setManagerTitle(e.target.value)}
                  placeholder="예: 마케팅 매니저"
                  autoComplete="off"
                />
              </label>

              <label className="field" htmlFor="brand-email">
                <span className="section-title">이메일</span>
                <input
                  id="brand-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="예: brand@company.com"
                  autoComplete="off"
                />
              </label>

              <label className="field" htmlFor="brand-website">
                <span className="section-title">브랜드 공식 사이트</span>
                <input
                  id="brand-website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="예: https://brand.com"
                  autoComplete="off"
                />
              </label>
            </div>
          </div>

          <div className="bottom-action">
            <button
              className="next-button"
              type="button"
              disabled={!canStep1}
              onClick={() => setStep(2)}
            >
              다음
            </button>
          </div>
        </>
      )}

      {/* ── Step 2: 타겟 & 카테고리 ────────────────────────── */}
      {step === 2 && (
        <>
          <div className="scroll-area">
            <div className="content">
              <section className="title-block">
                <h1>어떤 고객을 위한 브랜드인가요?</h1>
                <p>매칭 정확도를 위해 알려주세요</p>
              </section>

              <div className="category-section">
                <span className="section-title">주요 제품 카테고리</span>
                <div className="category-grid">
                  {BRAND_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`category-button ${
                        category === c ? "category-button-selected" : ""
                      }`}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="category-section">
                <span className="section-title">타겟 고객 연령대</span>
                <span className="section-help">복수 선택 가능</span>
                <div className="category-grid">
                  {BRAND_AGE_GROUPS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={`category-button ${
                        ageGroups.includes(a) ? "category-button-selected" : ""
                      }`}
                      onClick={() => toggleAge(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="reuse-section">
                <span className="section-title">타겟 고객 성별</span>
                <div className="reuse-row">
                  {BRAND_GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`reuse-button ${
                        gender === g ? "reuse-button-selected" : ""
                      }`}
                      onClick={() => setGender(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-action">
            <button
              className="next-button"
              type="button"
              disabled={!canStep2}
              onClick={() => setStep(3)}
            >
              다음
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: 추가 정보 (선택) ───────────────────────── */}
      {step === 3 && (
        <>
          <div className="scroll-area">
            <div className="content">
              <section className="title-block">
                <h1>조금 더 알려주시겠어요?</h1>
                <p>선택 항목이에요. 비워두셔도 괜찮아요</p>
              </section>

              <div className="reuse-section">
                <span className="section-title">브랜드 단계 (선택)</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  {BRAND_STAGES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      className={`reuse-button ${
                        brandStage === s.value ? "reuse-button-selected" : ""
                      }`}
                      style={{ width: "100%" }}
                      onClick={() =>
                        setBrandStage(brandStage === s.value ? "" : s.value)
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="story-section">
                <span className="section-title">간단한 메시지 (선택)</span>
                <textarea
                  className="story-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="어떤 인플루언서와 협업하고 싶으신지 자유롭게 적어주세요"
                />
              </div>
            </div>
          </div>

          <div className="bottom-action">
            <button
              className="next-button"
              type="button"
              onClick={() => setStep(4)}
            >
              다음
            </button>
          </div>
        </>
      )}

      {/* ── Step 4: 약관 동의 ──────────────────────────────── */}
      {step === 4 && (
        <>
          <div className="scroll-area">
            <div className="content">
              <section className="title-block">
                <h1>약관에 동의해주세요</h1>
                <p>입점 신청을 위해 필요해요</p>
              </section>

              <div style={{ width: "100%" }}>
                <label className="email-consent" style={{ marginTop: 0 }}>
                  <input
                    className="email-consent-checkbox"
                    type="checkbox"
                    checked={agreeAll}
                    onChange={toggleAll}
                  />
                  <span className="email-consent-text">
                    <strong>전체 동의</strong>
                  </span>
                </label>

                <div className="divider" style={{ margin: "14px 0" }} />

                <label className="email-consent" style={{ marginTop: 0 }}>
                  <input
                    className="email-consent-checkbox"
                    type="checkbox"
                    checked={termService}
                    onChange={(e) => setTermService(e.target.checked)}
                  />
                  <span className="email-consent-text">
                    <span className="email-consent-required">[필수]</span> 서비스 이용약관 동의{" "}
                    <span className="email-consent-policy">보기</span>
                  </span>
                </label>

                <label className="email-consent">
                  <input
                    className="email-consent-checkbox"
                    type="checkbox"
                    checked={termPrivacy}
                    onChange={(e) => setTermPrivacy(e.target.checked)}
                  />
                  <span className="email-consent-text">
                    <span className="email-consent-required">[필수]</span> 개인정보 처리방침 동의{" "}
                    <span className="email-consent-policy">보기</span>
                  </span>
                </label>

                <label className="email-consent">
                  <input
                    className="email-consent-checkbox"
                    type="checkbox"
                    checked={termBusinessInfo}
                    onChange={(e) => setTermBusinessInfo(e.target.checked)}
                  />
                  <span className="email-consent-text">
                    <span className="email-consent-required">[필수]</span> 사업자정보 활용 동의{" "}
                    <span className="email-consent-policy">보기</span>
                  </span>
                </label>

                <label className="email-consent">
                  <input
                    className="email-consent-checkbox"
                    type="checkbox"
                    checked={termMarketing}
                    onChange={(e) => setTermMarketing(e.target.checked)}
                  />
                  <span className="email-consent-text">
                    [선택] 마케팅 정보 수신 동의{" "}
                    <span className="email-consent-policy">보기</span>
                  </span>
                </label>
              </div>

              {submitError && (
                <p className="submit-error">{submitError}</p>
              )}
            </div>
          </div>

          <div className="bottom-action">
            <button
              className="next-button"
              type="button"
              disabled={!canSubmit || isSaving}
              onClick={submitApplication}
            >
              {isSaving ? "신청 중…" : "입점 신청하기"}
            </button>
          </div>
        </>
      )}

      {/* ── Step 5: 완료 ───────────────────────────────────── */}
      {step === 5 && (
        <div className="completion-content">
          <img className="completion-logo" src={completionLogoUrl} alt="repitch" />
          <p className="completion-tagline">
            브랜드의 찐팬과
            <br />
            만나는 첫 걸음
          </p>
          <h1 className="completion-title">
            <span>입점 신청이</span>{" "}
            <span className="completion-blue">접수됐어요!</span>
          </h1>
          <p className="completion-copy">
            검토 후 영업일 기준 3일 이내
            <br />
            입력하신 이메일로 안내합니다
          </p>
          <button className="completion-close" type="button" onClick={onClose}>
            닫기
          </button>
        </div>
      )}
    </section>
  );
}

export function BrandOnboardingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // isSaving lives here so the shell-level close paths (X / ESC / overlay) can
  // be blocked while the insert is in flight — same guard as influencer.
  const [isSaving, setIsSaving] = useState(false);
  const guardedClose = () => {
    if (isSaving) return;
    onClose();
  };

  return (
    <OnboardingModal
      open={open}
      onClose={guardedClose}
      ariaLabel="브랜드 사전 입점 신청"
    >
      <BrandOnboardingFlow
        onClose={guardedClose}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
      />
    </OnboardingModal>
  );
}
