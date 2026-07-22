'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Header, type Audience } from '@/components/ui/header-1';
import { ApplicantBand } from '@/components/ui/applicant-band';
import { InfluencerBody } from '@/components/ui/influencer-body';
import { BrandBody } from '@/components/ui/brand-body';
import { Footer } from '@/components/ui/footer-section';

export function LandingPage() {
  const [audience, setAudience] = React.useState<Audience>('influencer');
  const router = useRouter();

  // Header "로그인": 브랜드·인플루언서 모두 /login으로 (역할 분기는 로그인/가입에서).
  const handleStart = () => router.push('/login');

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
    </div>
  );
}
