"use client";
import type { ReactNode } from "react";
import { ChevronLeft, ExternalLink, X } from "lucide-react";
import { PlatformIcon, fmt } from "@/components/dashboard/proposal-detail";
import type { Influencer } from "@/components/dashboard/seed-influencers";

// Shared profile summary panel — used by the 인플루언서 DB split view and the
// campaign 신청자 검토 panel. `matchScore` shows a score in the header (신청자
// 컨텍스트); `footer` is a sticky action bar (역제안 보기 / 선정·보류).
export function InfluencerSummary({
  inf,
  matchScore,
  footer,
  onBack,
  onClose,
}: {
  inf: Influencer;
  matchScore?: number;
  footer?: ReactNode;
  onBack: () => void;
  onClose: () => void;
}) {
  const metrics: [string, string][] = [
    ["팔로워", fmt(inf.followers)],
    ["평균 조회수", fmt(inf.avg_views)],
    ["참여율", `${inf.engagement}%`],
    ["협업 수", `${inf.collabs}회`],
  ];
  const info: [string, string][] = [
    ["카테고리", inf.category],
    ["유형", inf.creator_type],
    ["성별", inf.gender],
    ["활동 지역", inf.region],
  ];
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 px-6 py-6 md:px-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
        >
          <ChevronLeft className="size-4" /> 목록
        </button>

        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-base font-bold">
            {inf.profile_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <a
              href={inf.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-lg font-bold hover:underline"
            >
              <span className="truncate">{inf.profile_name}</span>
              <PlatformIcon platform={inf.platform} className="size-4 shrink-0 text-foreground/70" />
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </a>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {inf.category} · {inf.creator_type} · {inf.gender} · {inf.region}
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-start gap-3">
            {matchScore != null && (
              <div className="text-right">
                <div className="text-3xl font-extrabold leading-none tracking-tight tabular-nums">{matchScore}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">매칭 점수</div>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="hidden size-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:grid"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Core metrics */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border">
          {metrics.map(([l, v]) => (
            <div key={l} className="p-4">
              <div className="text-[11px] text-muted-foreground">{l}</div>
              <div className="mt-1 text-xl font-extrabold tabular-nums">{v}</div>
            </div>
          ))}
        </div>

        {/* Activity info */}
        <div className="mt-5">
          {info.map(([l, v]) => (
            <div key={l} className="flex items-center justify-between gap-3 border-b border-dashed border-border py-1.5 text-[13px]">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-foreground/80">{inf.bio}</p>
      </div>

      {footer && (
        <div className="sticky bottom-0 border-t border-border bg-background px-6 py-3 md:px-8">{footer}</div>
      )}
    </div>
  );
}
