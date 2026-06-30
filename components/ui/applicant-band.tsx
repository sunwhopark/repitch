"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Audience } from "@/components/ui/header-1";

/**
 * ApplicantBand — colla-style black strip under the header showing how many
 * have applied. Content switches with the audience toggle.
 *
 * Counts come from the get_application_counts() RPC (security definer): anon
 * gets the counts only, never the table rows (RLS read-block stays intact).
 * Hidden while loading, on fetch error, or when the active count is 0 — so a
 * broken/zero value is never shown. Fades in once a positive count is ready.
 */
type Counts = { brand: number; proposal: number; reservation: number };

// TEMP: launch-period display offsets added on top of the real counts.
// Remove (set to 0) once the real numbers stand on their own.
const INFLUENCER_COUNT_OFFSET = 124;
const BRAND_COUNT_OFFSET = 31;

export function ApplicantBand({ audience }: { audience: Audience }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.rpc("get_application_counts").then(({ data, error }) => {
      if (!active) return;
      if (error || !data) {
        setFailed(true);
        return;
      }
      setCounts({
        brand: Number(data.brand) || 0,
        proposal: Number(data.proposal) || 0,
        reservation: Number(data.reservation) || 0,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  // Hide while loading or on error — no flicker, no broken value.
  if (failed || !counts) return null;

  // Influencer band = 사전예약 + 역제안서 합산. Brand band = brand only.
  // Plus the temporary launch-period offsets above.
  const count =
    audience === "influencer"
      ? counts.reservation + counts.proposal + INFLUENCER_COUNT_OFFSET
      : counts.brand + BRAND_COUNT_OFFSET;
  // Never surface 0.
  if (count <= 0) return null;

  return (
    <div className="animate-in fade-in sticky top-14 z-40 w-full bg-foreground text-background duration-500">
      <div className="mx-auto flex h-9 max-w-5xl items-center justify-center gap-2 px-4 text-sm">
        <span className="size-1.5 shrink-0 rounded-full bg-green-400" aria-hidden="true" />
        {audience === "influencer" ? (
          <span>
            크리에이터 <strong className="font-bold">{count}</strong>명이 이미 신청했어요
          </span>
        ) : (
          <span>
            브랜드 <strong className="font-bold">{count}</strong>곳이 이미 사전 입점했습니다
          </span>
        )}
      </div>
    </div>
  );
}
