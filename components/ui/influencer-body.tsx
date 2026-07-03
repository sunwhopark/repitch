"use client";
import { useState } from "react";
import { HeroSection } from "@/components/ui/hero-1";
import { WaveSection } from "@/components/ui/wave-path";
import { Testimonials } from "@/components/ui/testimonials-columns-1";
import { ContentFitSection } from "@/components/ui/content-fit-section";
import { SolutionSection } from "@/components/ui/solution-section";
import { QaChatSection } from "@/components/ui/qa-chat-section";
import { PerksSection } from "@/components/ui/perks-section";
import { CtaSection } from "@/components/ui/cta-section";
import { OnboardingModal } from "@/components/ui/onboarding-modal";
import { ReservationModal } from "@/components/ui/reservation-modal";

// QA intro: the "이렇게 작성한 제안서는…" copy on top, then the same heading
// block as BrandBody (브랜드 → 인플루언서). Chat renders below.
const qaIntro = (
  <>
    <p className="mx-auto max-w-2xl text-center text-2xl leading-snug text-foreground/80 md:text-3xl">
      이렇게 작성한 제안서는
      <br />
      <img
        src="/repitch_wordmark_alpha.png"
        alt="repitch"
        className="inline-block h-[0.85em] w-auto translate-y-[0.12em] dark:invert"
      />{" "}
      AI의 재가공을 거쳐 정돈된 톤앤매너로
      <br />
      브랜드에게 전송됩니다.
    </p>
    <div className="mt-12 text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">자주 묻는 질문</h2>
      <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
        repitch 입점 전, 인플루언서가 가장 많이 묻는 질문을 모았습니다.
      </p>
    </div>
  </>
);

export function InfluencerBody() {
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const openOnboarding = () => setOnboardingOpen(true);
  const [reservationOpen, setReservationOpen] = useState(false);
  const openReservation = () => setReservationOpen(true);

  return (
    <>
      <HeroSection onTryProposal={openOnboarding} onReserve={openReservation} />
      <WaveSection />
      <Testimonials />
      <ContentFitSection />
      <SolutionSection />
      <QaChatSection intro={qaIntro} />
      <PerksSection />
      <CtaSection onTryProposal={openOnboarding} onReserve={openReservation} />
      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />
      <ReservationModal
        open={reservationOpen}
        onClose={() => setReservationOpen(false)}
      />
    </>
  );
}
