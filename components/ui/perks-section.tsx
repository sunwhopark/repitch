import { Check, ReceiptText, TrendingUp, Crown } from "lucide-react";
import { FeatureCard } from "@/components/ui/feature-card";

const RepitchLogo = () => (
  <img
    src="/repitch_wordmark_alpha.png"
    alt="repitch"
    className="inline-block h-[0.85em] w-auto translate-y-[0.12em] dark:invert"
  />
);

// Two-line title: small "Benefit N" eyebrow (with check) + Korean benefit name.
function CardTitle({ index, name }: { index: number; name: string }) {
  return (
    <>
      <span className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Check className="size-4" />
        Benefit {index}
      </span>
      <span className="mt-1 block">{name}</span>
    </>
  );
}

export function PerksSection() {
  return (
    <section className="w-full px-4 pt-8 pb-24">
      <div className="mx-auto max-w-5xl">
        {/* Top copy */}
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground">
            ONLY 사전예약 크리에이터들을 위한 혜택
          </span>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            <RepitchLogo />
            는 3분기 정식 출시 예정입니다.
            <br />
            사전예약을 해주신 크리에이터 분들께,
          </h2>
        </div>

        {/* Cards */}
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<ReceiptText className="size-6" />}
            title={<CardTitle index={1} name="매칭 수수료 3회 면제" />}
            description="초기 매칭 계약에 대해 플랫폼 수수료 전액 면제 혜택 제공"
          />
          <FeatureCard
            icon={<TrendingUp className="size-6" />}
            title={<CardTitle index={2} name="노출 및 알고리즘 우대" />}
            description="메인 상단 노출 및 검색 결과 알고리즘 가산점 부여"
          />
          <FeatureCard
            icon={<Crown className="size-6" />}
            title={<CardTitle index={3} name="브랜드 우선 매칭권" />}
            description="프리미엄 브랜드 캠페인 런칭 시 최우선 지원 권한 지급"
          />
        </div>

        {/* Footnote */}
        <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
          <RepitchLogo />
          는 현재 알고리즘과 BM에 대한 특허를 출원하고
          <br />
          Google Korea와 협업 논의를 진행 중입니다.
        </p>
      </div>
    </section>
  );
}
