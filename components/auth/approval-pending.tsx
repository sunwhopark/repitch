"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

// 로그인은 됐지만 brands.approved = false 인 계정에 보여주는 게이트 화면.
// 승인은 운영자가 Supabase에서 approved 토글(당분간 수동).
export function ApprovalPending({ brandName }: { brandName?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <div className="w-full max-w-sm">
        <Clock className="mx-auto size-12" strokeWidth={1.5} />
        <h1 className="mt-5 text-xl font-semibold tracking-tight">아직 승인 대기 중이에요</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {brandName ? `${brandName} 계정의 ` : ""}가입 검토가 진행 중이에요. 영업일 기준 1~3일 이내에
          입력하신 이메일로 이용 안내를 보내드려요.
        </p>
        <Button type="button" variant="outline" disabled={loading} onClick={logout} className="mt-6 h-11 rounded-full px-6">
          로그아웃
        </Button>
      </div>
    </div>
  );
}
