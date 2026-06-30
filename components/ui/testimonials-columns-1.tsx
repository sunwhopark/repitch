"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// ─── Anonymous avatar ────────────────────────────────────────────────

function AnonAvatar({ variant = "influencer" }: { variant?: "influencer" | "brand" }) {
  const ring =
    variant === "influencer"
      ? "from-orange-200 via-rose-300 to-violet-400"
      : "from-slate-300 to-slate-500";
  return (
    <div className={cn("w-10 h-10 rounded-full p-px flex-shrink-0 bg-gradient-to-br", ring)}>
      <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="white">
          <circle cx="14" cy="10" r="5" />
          <path d="M3 28c0-6.075 4.925-11 11-11s11 4.925 11 11H3z" />
        </svg>
      </div>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────

const influencerBubbles = [
  {
    quote:
      "내 채널과 fit하지 않은 광고들, 받자니 팔로워들이 싫어할 거 같고 안 받자니 수입이 불안정해요.",
    label: "인스타그램 인플루언서 · 팔로워 6,500",
    align: "left" as const,
  },
  {
    quote:
      "매번 2차 활용 여부, 플랫폼 내 광고, 원본 제공 여부, 단가를 적어서 보내는 게 너무 불편해요.",
    label: "유튜브 크리에이터 · 팔로워 28,000",
    align: "right" as const,
  },
  {
    quote:
      "당당한 무상협찬, 무상제공, 빡빡한 가이드라인에 과한 피드백… 제가 원하는 조건으로 받고 싶어요.",
    label: "인스타그램 인플루언서 · 팔로워 10,000",
    align: "left" as const,
  },
  {
    quote:
      "피부과 광고를 했는데, 제가 받은 서비스와 실제로 제공되는 서비스의 질 차이가 많이 나서 제 신뢰도가 떨어졌어요.",
    label: "뷰티 인플루언서 · 팔로워 12,400",
    align: "right" as const,
  },
] as const;

// ─── Speech bubble component ─────────────────────────────────────────

function SpeechBubble({
  quote,
  label,
  align,
  index,
}: {
  quote: string;
  label: string;
  align: "left" | "right";
  index: number;
}) {
  const isLeft = align === "left";
  return (
    <motion.div
      className={cn("flex flex-col gap-2", isLeft ? "items-start" : "items-end")}
      initial={{ opacity: 0, x: isLeft ? -16 : 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}
    >
      {/* Avatar + label */}
      <div className={cn("flex items-center gap-2", !isLeft && "flex-row-reverse")}>
        <AnonAvatar variant="influencer" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative bg-card border border-border rounded-2xl px-5 py-4 max-w-sm shadow-sm text-sm leading-relaxed",
          isLeft ? "rounded-tl-none" : "rounded-tr-none"
        )}
      >
        &ldquo;{quote}&rdquo;
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────

export function Testimonials() {
  return (
    <section className="w-full py-24">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Section header */}
        <motion.div
          className="flex flex-col items-center gap-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="border border-border rounded-full px-3 py-1 text-xs text-muted-foreground">
            Problems
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-center">
            기존 협업의 문제점 
          </h2>
          <p className="text-muted-foreground text-center max-w-md">
            인플루언서와 브랜드, 양쪽 모두 같은 문제를 겪고 있었습니다.
          </p>
        </motion.div>

        {/* ── Influencer problems ──────────────────────────────── */}
        <div>
          <motion.h3
            className="text-xl md:text-2xl font-semibold mb-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            인플루언서가 느낀 문제점
          </motion.h3>

          <div className="flex flex-col gap-5 max-w-2xl mx-auto">
            {influencerBubbles.map((bubble, i) => (
              <SpeechBubble key={i} {...bubble} index={i} />
            ))}
          </div>

          {/* Dark summary box */}
          <motion.div
            className="mt-12 max-w-2xl mx-auto bg-foreground text-background rounded-2xl px-8 py-7"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-sm leading-8 opacity-75">
              내 채널과 맞지 않는 광고.
              <br />
              끝없는 협상.
              <br />
              받아보니 달랐던 제품.
            </p>
            <p className="text-sm leading-8 mt-3">
              처음 보는 제품을{" "}
              <span className="text-orange-300 font-medium">억지로 소개하면</span>,
              <br />
              <span className="text-orange-300 font-medium">
                팔로워도 떠나고, 신뢰도 잃습니다.
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
