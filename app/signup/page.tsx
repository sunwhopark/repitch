"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone, Sparkles } from "lucide-react";
import { BrandSignup } from "@/components/auth/brand-signup";
import { InfluencerSignup } from "@/components/auth/influencer-signup";
import { SignupFrame } from "@/components/auth/signup-shared";

function SignupInner() {
  const searchParams = useSearchParams();
  // ?as로 진입하면 해당 역할 화면을 선선택(뒤로가기로 다시 고를 수 있음).
  const as = searchParams.get("as");
  const [role, setRole] = useState<null | "brand" | "influencer">(
    as === "influencer" || as === "brand" ? as : null,
  );

  if (role === "brand") return <BrandSignup onBack={() => setRole(null)} />;
  if (role === "influencer") return <InfluencerSignup onBack={() => setRole(null)} />;

  return (
    <SignupFrame>
      <h1 className="text-xl font-semibold tracking-tight">어떤 계정을 만들까요?</h1>
      <p className="mt-1 text-sm text-muted-foreground">역할에 맞는 화면으로 안내해 드려요.</p>
      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => setRole("influencer")}
          className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-foreground/30"
        >
          <Sparkles className="size-5 shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-sm font-semibold">인플루언서</div>
            <div className="text-xs text-muted-foreground">캠페인에 지원하고 브랜드에 역제안을 보내요.</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setRole("brand")}
          className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-foreground/30"
        >
          <Megaphone className="size-5 shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-sm font-semibold">브랜드</div>
            <div className="text-xs text-muted-foreground">캠페인을 열고 역제안을 검토해요. (승인제)</div>
          </div>
        </button>
      </div>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        이미 계정이 있으신가요? <a href="/login" className="font-semibold text-foreground underline underline-offset-2">로그인</a>
      </p>
    </SignupFrame>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}
