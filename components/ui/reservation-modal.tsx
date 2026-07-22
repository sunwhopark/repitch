"use client";
import { useState } from "react";
import { OnboardingModal } from "@/components/ui/onboarding-modal";
import { supabase } from "@/lib/supabase/client";

/**
 * ReservationModal — lightweight email-only 사전예약 form.
 *
 * Reuses the shared OnboardingModal shell (portal, ESC/overlay/close, focus
 * trap, scroll lock, reduced-motion) and its monotone .onboarding-scope classes.
 * Saves to email_reservations (anon insert, RLS consent gate). No .select().
 */

const completionLogoUrl = "/repitch_wordmark_alpha.png";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ReservationFlow({
  onClose,
  isSaving,
  setIsSaving,
}: {
  onClose: () => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const canSubmit = isValidEmail(email.trim()) && consent;

  async function submit() {
    if (isSaving) return;
    if (!isValidEmail(email.trim())) {
      setError("올바른 이메일 형식이 아니에요.");
      return;
    }
    if (!consent) {
      setError("개인정보 수집에 동의해주세요.");
      return;
    }

    setIsSaving(true);
    setError("");
    // No .select() — RLS blocks anon reads; we only need the error flag.
    const { error: insertError } = await supabase.from("email_reservations").insert({
      email: email.trim(),
      privacy_consent: consent,
      consent_at: new Date().toISOString(),
    });
    setIsSaving(false);

    if (insertError) {
      setError("사전예약에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <section className="mobile-screen completion-screen">
        <div className="completion-content">
          <img className="completion-logo" src={completionLogoUrl} alt="repitch" />
          <p className="completion-tagline">
            가장 먼저
            <br />
            소식을 받아보세요
          </p>
          <h1 className="completion-title">
            <span>사전예약이</span>{" "}
            <span className="completion-blue">완료됐어요!</span>
          </h1>
          <p className="completion-copy">
            출시되면 입력하신 이메일로
            <br />
            가장 먼저 알려드릴게요
          </p>
          <button className="completion-close" type="button" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mobile-screen" style={{ justifyContent: "center" }}>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}
      >
        <img
          src={completionLogoUrl}
          alt="repitch"
          style={{ width: 96, height: "auto", alignSelf: "center", marginBottom: 4 }}
        />

        <div className="title-block">
          <h1>사전예약하고 가장 먼저 만나보세요</h1>
          <p>출시되면 입력하신 이메일로 알려드릴게요</p>
        </div>

        <input
          className="email-modal-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) submit();
          }}
        />

        <label className="email-consent" style={{ marginTop: 0 }}>
          <input
            className="email-consent-checkbox"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (error) setError("");
            }}
          />
          <span className="email-consent-text">
            <a
              className="email-consent-policy"
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              [개인정보 처리방침]
            </a>{" "}
            개인정보 수집·이용에 동의합니다{" "}
            <span className="email-consent-required">(필수)</span>
          </span>
        </label>

        {error && <p className="email-modal-error">{error}</p>}

        <button
          className="next-button"
          type="button"
          disabled={!canSubmit || isSaving}
          onClick={submit}
        >
          {isSaving ? "저장 중…" : "사전예약"}
        </button>
      </div>
    </section>
  );
}

export function ReservationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // isSaving lives here so the shell-level close paths (X / ESC / overlay) are
  // blocked while the insert is in flight.
  const [isSaving, setIsSaving] = useState(false);
  const guardedClose = () => {
    if (isSaving) return;
    onClose();
  };

  return (
    <OnboardingModal open={open} onClose={guardedClose} ariaLabel="사전예약">
      <ReservationFlow
        onClose={guardedClose}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
      />
    </OnboardingModal>
  );
}
