"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/feature-card";
import { WavePath } from "@/components/ui/wave-path";
import { BrandOnboardingModal } from "@/components/ui/brand-onboarding-modal";
import {
  ArrowRightIcon,
  Check,
  Crown,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { QaChatSection, type Msg } from "@/components/ui/qa-chat-section";

/**
 * BrandBody — the "brand" audience landing body.
 *
 * Copy is sourced verbatim from brand-landing-copy.md (v1) with the Solution
 * section + the extra Q&A item taken from brand-landing-copy-v2-solution.md.
 * Tone: 단정형 (per the copy guide, "~드리겠습니다" 류 굽힌 어미 제거).
 * Visual tokens mirror InfluencerBody — black & white, no color accent.
 */

// Neutral brand-manager avatar for the QA chat. Empty → neutral placeholder
// circle; swap this for a real asset later. (repitch AI avatar is the default.)
const BRAND_USER_AVATAR = "";

const RepitchLogo = () => (
  <img
    src="/repitch_wordmark_alpha.png"
    alt="repitch"
    className="inline-block h-[0.85em] w-auto translate-y-[0.12em] dark:invert"
  />
);

export function BrandBody() {
  const [applyOpen, setApplyOpen] = useState(false);
  // Both the Hero and Closing CTAs open the same 사전 입점 신청 modal.
  const handleApply = () => setApplyOpen(true);

  return (
    <>
      <BrandHeroSection onApply={handleApply} />
      <BrandWaveDivider />
      <BrandProblemSection />
      <BrandSolutionSection />
      <QaChatSection
        intro={brandQaIntro}
        script={brandQaScript}
        userAvatar={BRAND_USER_AVATAR}
      />
      <BrandPerksSection />
      <BrandClosingSection onApply={handleApply} />
      <BrandOnboardingModal open={applyOpen} onClose={() => setApplyOpen(false)} />
    </>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────
function BrandHeroSection({ onApply }: { onApply: () => void }) {
  return (
    <section className="mx-auto w-full max-w-5xl">
      {/* Top Shades */}
      <div
        aria-hidden="true"
        className="absolute inset-0 isolate hidden overflow-hidden contain-strict lg:block"
      >
        <div className="absolute inset-0 -top-14 isolate -z-10 bg-[radial-gradient(35%_80%_at_49%_0%,color-mix(in_srgb,var(--color-foreground)_8%,transparent),transparent)] contain-strict" />
      </div>

      {/* X Bold Faded Borders */}
      <div
        aria-hidden="true"
        className="absolute inset-0 mx-auto hidden min-h-screen w-full max-w-5xl lg:block"
      >
        <div className="absolute inset-y-0 left-0 z-10 h-full w-px bg-foreground/15 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]" />
        <div className="absolute inset-y-0 right-0 z-10 h-full w-px bg-foreground/15 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]" />
      </div>

      {/* main content — full-height like InfluencerBody hero so copy is vertically
          centered and the wave divider falls below the fold. */}
      <div className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center gap-5 py-24">
        {/* X Content Faded Borders */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-[1] size-full overflow-hidden"
        >
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
        </div>

        <h1
          className={cn(
            "fade-in slide-in-from-bottom-10 animate-in text-balance fill-mode-backwards text-center text-4xl tracking-tight delay-100 duration-500 ease-out md:text-5xl lg:text-6xl",
            "[text-shadow:0_0px_50px_color-mix(in_srgb,var(--color-foreground)_20%,transparent)]"
          )}
        >
          힘들게 찾지 마세요.
          <br />
          브랜드의 찐팬이 먼저 제안합니다.
        </h1>

        <p className="fade-in slide-in-from-bottom-10 mx-auto max-w-xl animate-in fill-mode-backwards text-center text-base text-foreground/80 tracking-wider delay-200 duration-500 ease-out sm:text-lg md:text-xl">
          탐색·협상 비용은 낮게, 광고 KPI는 높게.
          <br />
          repitch는 매칭의 방향을 뒤집어 진정성과 성과를 동시에 만듭니다.
        </p>

        <div className="fade-in slide-in-from-bottom-10 flex animate-in flex-col items-center fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
          <Button className="rounded-full" size="lg" onClick={onApply}>
            브랜드 사전 입점 신청
            <ArrowRightIcon className="size-4 ms-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Wave divider (pure visual, no copy) ────────────────────────────────
function BrandWaveDivider() {
  return (
    <section className="relative flex w-full flex-col items-center justify-center py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 size-full -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-foreground)_10%,transparent),transparent_50%)] blur-[30px]"
      />
      <WavePath />
    </section>
  );
}

// ── Problem ────────────────────────────────────────────────────────────
const problemCards = [
  {
    quote:
      "마케팅 리소스는 부족한데, 대행사를 쓰면 수수료가 너무 많이 들어요. 그렇다고 직접 찾자니 시간이 없죠.",
    role: "마케팅 매니저",
    category: "D2C 뷰티 스타트업",
  },
  {
    quote:
      "어떤 인플루언서가 저희 브랜드와 정말 잘 맞는지 모르겠어요. 팔로워 수 말고 다른 기준이 필요한데 그게 없어요.",
    role: "브랜드 매니저",
    category: "라이프스타일 브랜드",
  },
  {
    quote:
      "인플루언서의 KPI를 예측하기가 힘들어요. 결과를 까봐야 아는데, 그러면 이미 예산은 쓴 뒤잖아요.",
    role: "퍼포먼스 마케터",
    category: "이커머스 스타트업",
  },
  {
    quote:
      "저희 브랜드의 진짜 팬이 광고해줬으면 좋겠어요. 돈 받고 하는 광고는 팔로워들도 다 알아채요.",
    role: "CEO",
    category: "헬스·피트니스 스타트업",
  },
];

function BrandAvatar() {
  return (
    <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 p-px">
      <div className="flex size-full items-center justify-center rounded-full bg-secondary">
        <svg viewBox="0 0 28 28" className="size-5" fill="white">
          <circle cx="14" cy="10" r="5" />
          <path d="M3 28c0-6.075 4.925-11 11-11s11 4.925 11 11H3z" />
        </svg>
      </div>
    </div>
  );
}

function BrandProblemSection() {
  return (
    <section className="w-full py-24">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Section header */}
        <div className="mb-20 flex flex-col items-center gap-4">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            Problems
          </span>
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            마케터와 브랜드의 목소리를 들었습니다
          </h2>
          <p className="max-w-md text-center text-muted-foreground">
            다른 누구도 아닌, 현장에 있는 분들이 가장 잘 알고 있습니다.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {problemCards.map((card, i) => (
            <div
              key={i}
              className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <p className="flex-1 text-sm leading-relaxed">
                &ldquo;{card.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <BrandAvatar />
                <div>
                  <p className="text-sm font-medium leading-snug">{card.role}</p>
                  <p className="text-xs text-muted-foreground">{card.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dark summary box */}
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl bg-foreground px-8 py-7 text-background">
          <p className="text-sm leading-8 opacity-75">
            알 수 없는 KPI, 일일이 찾아야 하는 인플루언서,
            <br />
            높은 대행사 수수료, 수동적인 캠페인 관리 —
          </p>
          <p className="mt-3 text-sm leading-8">
            {/* Wordmark PNG is black → invisible on this dark box, so render as text. */}
            <span className="font-semibold">repitch</span>가 해결합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Solution (v2) ──────────────────────────────────────────────────────
const solutions = [
  {
    number: "01",
    title: "가만히 있어도, 찐팬이 먼저 손을 듭니다",
    body: [
      "브랜드의 어떤 제품·서비스든, 실사용을 인증한 인플루언서가 직접 역제안서를 보냅니다. 캠페인을 등록할 필요도, 공고를 올릴 필요도 없습니다.",
      "기획 의도·타겟팅·기대 KPI·보수와 일정까지 작성된 채로 도착하기에, 브랜드는 거절 / 협의 / 수락 — 세 가지 버튼 중 하나만 누르면 됩니다.",
    ],
    points: [
      "캠페인 등록 없이도 항상 역제안 수신",
      "실사용 인증을 통과한 진성 팬에게서만 도착",
      "거절 / 협의 / 수락 3-state 응답 — 감정 소모 없음",
    ],
    hasImage: true,
  },
  {
    number: "02",
    title: "특정 제품을 밀고 싶을 땐, 캠페인을 여세요",
    body: [
      "신제품 출시, 시즌 캠페인, 재고 정리 — 특정 제품·시기·예산을 정해 캠페인을 열 수 있습니다.",
      "관심 있는 인플루언서가 체험을 신청하면, 그중 선정한 인플루언서에게 제품을 발송합니다. 체험 후 광고를 진행하면 진정성과 KPI가 모두 높은 광고가 됩니다.",
      "광고가 진행되지 않더라도, 타겟 페르소나의 구체적인 피드백을 R&D 자료로 받습니다.",
    ],
    points: [
      "신제품·시즌·재고 등 목적별 캠페인 운영",
      "체험 신청 → 선정 → 발송 → 광고 / 피드백",
      "광고 미진행 시에도 데이터는 남습니다",
    ],
    hasImage: false,
  },
  {
    number: "03",
    title: "KPI는 묻지 않고, 자동으로 받습니다",
    body: [
      "상시 역제안이든 캠페인이든, 매칭이 성사된 모든 광고의 성과를 repitch가 자동으로 수집합니다.",
      "노출수·CTR·전환율·ROI를 인플루언서에게 매번 묻지 않아도, 실시간 KPI 리포트가 자동으로 채워집니다.",
    ],
    points: [
      "인플루언서 팔로업 없이 자동 집계",
      "기간별·캠페인별·인플루언서별 필터",
      "정식 출시 시 정산까지 통합",
    ],
    hasImage: false,
  },
];

function BrandSolutionSection() {
  return (
    <section className="w-full px-4 pt-8 pb-24">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="mb-16 flex flex-col items-center gap-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            <RepitchLogo />
            는 이렇게 작동합니다
          </h2>
          <p className="max-w-xl text-center text-muted-foreground">
            브랜드는 두 가지 채널로 인플루언서를 만납니다 — 가만히 있어도 들어오고,
            원할 땐 직접 엽니다.
          </p>
        </div>

        {/* Solutions — constrained to max-w-4xl (like the perks cards) so the
            cards keep a left/right gap instead of touching the section edges. */}
        <div className="mx-auto flex max-w-4xl flex-col gap-12">
          {solutions.map((s) => (
            <div
              key={s.number}
              className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:flex-row md:gap-10 md:p-8"
            >
              <div className="flex-shrink-0">
                <span className="flex size-12 items-center justify-center rounded-full border border-border text-lg font-semibold text-muted-foreground">
                  {s.number}
                </span>
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-semibold leading-snug md:text-2xl">
                  {s.title}
                </h3>

                <div className="space-y-3">
                  {s.body.map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {para}
                    </p>
                  ))}
                </div>

                <ul className="space-y-2">
                  {s.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {s.hasImage && (
                  <div className="mt-2 flex aspect-[16/9] w-full max-w-md items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                    역제안서 예시 이미지
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Q&A (v1 5개 + v2 1개) ──────────────────────────────────────────────
const qaItems = [
  {
    q: "비용은 얼마인가요?",
    a: "매칭이 성사되었을 때만 발생하는 성공 보수형 수수료 구조입니다. 사전 입점 신청 시 상세 가격을 안내합니다.",
  },
  {
    q: "어떤 플랫폼을 지원하나요?",
    a: "Instagram, TikTok, YouTube를 지원합니다.",
  },
  {
    q: "어떤 카테고리의 브랜드가 입점 가능한가요?",
    a: "뷰티·패션·식품·헬스·라이프스타일·앱서비스·전자기기 카테고리에서 시작하며, 점진적으로 확대됩니다.",
  },
  {
    q: "정식 출시는 언제인가요?",
    a: "2026년 3분기 정식 런칭 예정입니다. 사전 입점하시면 출시 즉시 안내합니다.",
  },
  {
    q: "인플루언서 풀은 얼마나 되나요?",
    a: "현재 마이크로 인플루언서(1만~10만 팔로워) 중심으로 베타 풀을 구축하고 있습니다.",
  },
  {
    q: "캠페인을 꼭 등록해야 인플루언서가 제안을 보내나요?",
    a: "아닙니다. 입점만 하시면 브랜드의 어떤 제품에 대해서도 역제안을 받을 수 있습니다. 캠페인 등록은 특정 제품·시기에 집중하고 싶을 때 추가로 활용하는 옵션입니다.",
  },
];

// Flatten the 6 Q&A pairs into a chat script (user 질문 → assistant 답변),
// keeping md order. Module-level const so the reference is stable across renders.
const brandQaScript: Msg[] = qaItems.flatMap((item): Msg[] => [
  { role: "user", text: item.q },
  { role: "assistant", text: item.a },
]);

// Brand-context intro above the chat (not a copy-paste of the influencer intro).
const brandQaIntro = (
  <div className="text-center">
    <h2 className="text-3xl font-bold tracking-tight md:text-4xl">자주 묻는 질문</h2>
    <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
      repitch 입점 전, 브랜드가 가장 많이 묻는 질문을 모았습니다.
    </p>
  </div>
);

// ── 사전 입점 혜택 (A / C / D) ─────────────────────────────────────────
function PerkTitle({ label, name }: { label: string; name: string }) {
  return (
    <>
      <span className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Check className="size-4" />
        {label}
      </span>
      <span className="mt-1 block">{name}</span>
    </>
  );
}

function BrandPerksSection() {
  return (
    <section className="w-full px-4 pt-8 pb-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
          지금 사전 입점하면
        </h2>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<ReceiptText className="size-6" />}
            title={<PerkTitle label="Benefit 1" name="베타 기간 무료 체험" />}
            description="정식 출시 전까지 모든 매칭 기능 무료 이용"
          />
          <FeatureCard
            icon={<TrendingUp className="size-6" />}
            title={<PerkTitle label="Benefit 2" name="첫 캠페인 KPI 리포트 무료" />}
            description="사전 입점 후 첫 캠페인의 KPI 리포트와 R&D 인사이트 리포트를 무료로 제공"
          />
          <FeatureCard
            icon={<Crown className="size-6" />}
            title={<PerkTitle label="Benefit 3" name="우선 매칭 권한" />}
            description="사전 입점 브랜드는 인플루언서 탐색 탭에 우선 노출됩니다"
          />
        </div>
      </div>
    </section>
  );
}

// ── Closing ────────────────────────────────────────────────────────────
const trustBadges = [
  "Google Korea · 크리에이터 산업 지원 협업 논의 중",
  "한양대학교 창업경진대회 최우수상",
  "AI 매칭·역제안 BM 특허 출원 중",
];

function BrandClosingSection({ onApply }: { onApply: () => void }) {
  return (
    <section className="w-full px-4 pt-8 pb-24">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-y-8 rounded-2xl px-4 py-12 text-center bg-[radial-gradient(40%_80%_at_50%_0%,color-mix(in_srgb,var(--color-foreground)_7%,transparent),transparent)]">
        {/* Trust badges */}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {trustBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Text block */}
        <div className="space-y-3">
          <p className="text-xl font-medium leading-relaxed md:text-2xl">
            브랜드의 찐팬과 협업하여,
            <br />
            브랜드 가치와 매출을 함께 높이세요.
          </p>
          <p className="text-foreground/80">
            2026년 3분기 정식 런칭 예정 — 그 시작은 <RepitchLogo />
            에서.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Button className="rounded-full" size="lg" onClick={onApply}>
            지금 사전 입점하기
            <ArrowRightIcon className="size-4 ms-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
