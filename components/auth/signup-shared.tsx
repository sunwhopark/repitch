"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function ConsentRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-foreground" />
      <span className="text-[13px] leading-relaxed text-muted-foreground">{children}</span>
    </label>
  );
}

export function Field({ label, children, help }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline gap-2">
        <Label className="text-[13px]">{label}</Label>
        {help && <span className="text-[11px] text-muted-foreground">{help}</span>}
      </div>
      {children}
    </div>
  );
}

// 로고 + 중앙 카드 프레임(가입 화면 공통).
export function SignupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <a href="/" className="mb-8 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/repitch_wordmark_alpha.png" alt="repitch" className="h-7 w-auto dark:invert" />
        </a>
        {children}
      </div>
    </div>
  );
}
