"use client";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Check } from "lucide-react";
import { WavePath } from "@/components/ui/wave-path";

const checks = [
  "크리에이터는 더 자연스러운 컨텐츠",
  "팔로워는 광고에 더 높은 신뢰",
  "크리에이터, 광고주, 팬 모두가 만족하는 협업",
];

// Each item reveals over its own slice of the section's scroll progress,
// so the pop-up is driven directly by how far you've scrolled.
function ScrollReveal({
  progress,
  range,
  className,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
  children: React.ReactNode;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [24, 0]);
  return (
    <motion.div style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

export function ContentFitSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // 0 when the section's top is near the bottom of the viewport,
    // 1 once it has scrolled up to ~40% of the viewport height.
    offset: ["start 0.9", "start 0.4"],
  });
  // Light smoothing so it doesn't feel jittery while scrolling.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <section ref={ref} className="relative w-full flex flex-col items-center py-24">
      {/* Wave divider (same curve reused from the wave section) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 size-full -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-foreground)_10%,transparent),transparent_50%)] blur-[30px]"
      />
      <div className="flex w-[70vw] flex-col items-center">
        <WavePath className="mb-16" />
      </div>

      {/* Scroll-linked reveal: 제목 → 체크1 → 체크2 → 체크3 */}
      <div className="flex flex-col items-center px-4">
        <ScrollReveal
          progress={progress}
          range={[0, 0.2]}
          className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-center"
        >
          좋아하는 제품은 좋은 컨텐츠가 됩니다.
        </ScrollReveal>

        <div className="mt-10 flex flex-col items-start gap-4">
          {checks.map((label, i) => (
            <ScrollReveal
              key={i}
              progress={progress}
              range={[0.2 + i * 0.2, 0.4 + i * 0.2]}
              className="flex items-center gap-3"
            >
              <Check className="size-5 shrink-0 text-foreground" strokeWidth={2.5} />
              <span className="text-base md:text-xl text-foreground/80">{label}</span>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
