'use client';
import React from 'react';
import { Header, type Audience } from '@/components/ui/header-1';
import { ApplicantBand } from '@/components/ui/applicant-band';
import { InfluencerBody } from '@/components/ui/influencer-body';
import { BrandBody } from '@/components/ui/brand-body';
import { Footer } from '@/components/ui/footer-section';

export function LandingPage() {
  const [audience, setAudience] = React.useState<Audience>('influencer');

  return (
    <div className="flex w-full flex-col">
      <Header audience={audience} onAudienceChange={setAudience} />
      <ApplicantBand audience={audience} />
      <main className="grow relative">
        {audience === 'influencer' ? <InfluencerBody /> : <BrandBody />}
      </main>
      <Footer />
    </div>
  );
}
