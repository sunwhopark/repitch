import { ArrowDown } from "lucide-react";

const steps = ["채널 정보를 입력하고", "서사를 입력하고"];

export function SolutionSection() {
  return (
    <section className="w-full px-4 pt-8 pb-24">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <h2 className="mb-16 text-center text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          <img
            src="/repitch_wordmark_alpha.png"
            alt="repitch"
            className="inline-block h-[0.85em] w-auto translate-y-[0.12em] dark:invert"
          />
          의 솔루션은 이렇게 작동합니다.
        </h2>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* LEFT — video */}
          <div className="w-full max-w-[280px] justify-self-center md:justify-self-end">
            <div className="overflow-hidden rounded-lg border border-border bg-muted/30 shadow-xl">
              <video
                className="block h-auto w-full origin-center scale-[1.06]"
                src="/repitch_influencer_body_video.mov"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          </div>

          {/* RIGHT — content */}
          <div className="flex flex-col items-center space-y-6 text-center">
            <span className="inline-block rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              repitch AI
            </span>

            <div className="flex flex-col items-center gap-3 text-xl md:text-2xl">
              {steps.map((step) => (
                <div key={step} className="flex flex-col items-center gap-3">
                  <p>{step}</p>
                  <ArrowDown className="size-5 text-muted-foreground" aria-hidden="true" />
                </div>
              ))}
              <p>원하는 조건을 입력하면</p>
              <p className="font-semibold">끝!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
