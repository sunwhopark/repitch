import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection({
  onTryProposal,
  onReserve,
}: {
  onTryProposal?: () => void;
  onReserve?: () => void;
}) {
  return (
    <section className="w-full px-4 pt-8 pb-24">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-y-8 rounded-2xl px-4 py-12 text-center bg-[radial-gradient(40%_80%_at_50%_0%,color-mix(in_srgb,var(--color-foreground)_7%,transparent),transparent)]">
        {/* Text block */}
        <div className="space-y-3 text-xl leading-relaxed md:text-2xl">
          <p className="font-medium">
            더 이상 브랜드의{" "}
            <span className="underline underline-offset-4">
              소모적인 광고 모델로 남지 마세요.
            </span>
          </p>
          <p className="text-foreground/80">
            진짜 좋아하는 제품을 브랜드에게 먼저 제안하고, 팬에게 전달하세요.
          </p>
          <p className="text-foreground/80">
            진정성 없는 광고로 더 이상 이미지를 소비하지 마세요.
          </p>
          <p className="text-foreground/80">
            그 시작을{" "}
            <img
              src="/repitch_wordmark.png"
              alt="repitch"
              className="inline-block h-[0.85em] w-auto translate-y-[0.12em] dark:invert"
            />
            가 돕겠습니다.
          </p>
        </div>

        {/* Buttons — same tone as the Hero CTA (light pill / dark pill) */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              className="rounded-full border border-foreground/15 shadow-sm"
              size="lg"
              variant="secondary"
              onClick={onTryProposal}
            >
              역제안서 써보기
            </Button>
            <Button className="rounded-full" size="lg" onClick={onReserve}>
              사전예약하기
              <ArrowRightIcon className="size-4 ms-2" />
            </Button>
          </div>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            *브랜드에게 전달해드리고
            <br />
            메일을 통해 향후 결과를 알려드리겠습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
