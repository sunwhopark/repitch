'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Header, type Audience } from '@/components/ui/header-1';
import { ApplicantBand } from '@/components/ui/applicant-band';
import { InfluencerBody } from '@/components/ui/influencer-body';
import { BrandBody } from '@/components/ui/brand-body';
import { Footer } from '@/components/ui/footer-section';
import { OnboardingModal } from '@/components/ui/onboarding-modal';

export function LandingPage() {
  const [audience, setAudience] = React.useState<Audience>('influencer');
  const [startOpen, setStartOpen] = React.useState(false);
  const router = useRouter();

  // Header "시작하기": Brand → workspace, Influencer → reverse-proposal onboarding.
  const handleStart = () => {
    if (audience === 'brand') {
      router.push('/dashboard');
    } else {
      setStartOpen(true);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <Header
        audience={audience}
        onAudienceChange={setAudience}
        onStart={handleStart}
      />
      <ApplicantBand audience={audience} />
      <main className="grow relative">
        {audience === 'influencer' ? <InfluencerBody /> : <BrandBody />}
      </main>
      <Footer />
      {/* Header-triggered onboarding (separate from InfluencerBody's own modal). */}
      <OnboardingModal open={startOpen} onClose={() => setStartOpen(false)} />
    </div>
  );
}
