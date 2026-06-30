import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export function HeroSection({
  onTryProposal,
  onReserve,
}: {
  onTryProposal?: () => void;
  onReserve?: () => void;
}) {
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

      {/* main content */}
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

        <a
          className={cn(
            "group mx-auto flex w-fit items-center gap-3 rounded-full border bg-card px-3 py-1 shadow",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out"
          )}
          href="#link"
        >
          <span className="text-xs">Early access</span>
          <span className="block h-5 border-l" />
          <ArrowRightIcon className="size-3 duration-150 ease-out group-hover:translate-x-1" />
        </a>

        <h1
          className={cn(
            "fade-in slide-in-from-bottom-10 animate-in text-balance fill-mode-backwards text-center text-4xl tracking-tight delay-100 duration-500 ease-out md:text-5xl lg:text-6xl",
            "[text-shadow:0_0px_50px_color-mix(in_srgb,var(--color-foreground)_20%,transparent)]"
          )}
        >
          <span className="font-medium">진정성</span>과 <span className="font-medium">수익성</span>,
          <br />
          모두 잡는 협업의 시작
        </h1>

        <p className="fade-in slide-in-from-bottom-10 mx-auto max-w-md animate-in fill-mode-backwards text-center text-base text-foreground/80 tracking-wider delay-200 duration-500 ease-out sm:text-lg md:text-xl">
          Pitch to brands you actually love.

        </p>

        <div className="fade-in slide-in-from-bottom-10 flex animate-in flex-row flex-wrap items-start justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
          <div className="flex flex-col items-center">
            <Button className="rounded-full border border-foreground/15 shadow-sm" size="lg" variant="secondary" onClick={onTryProposal}>
              역제안서 써보기
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">*커피쿠폰 100% 드림!</p>
          </div>
          <Button className="rounded-full" size="lg" onClick={onReserve}>
            사전예약
            <ArrowRightIcon className="size-4 ms-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
