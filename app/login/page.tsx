"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // 이메일 미확인 / 자격 불일치 등. 승인 여부는 /dashboard 레이아웃 게이트에서 판정.
      setError(
        error.message.toLowerCase().includes("email not confirmed")
          ? "이메일 확인이 필요해요. 받은 메일의 링크를 눌러 확인해 주세요."
          : "이메일 또는 비밀번호를 확인해 주세요.",
      );
      setLoading(false);
      return;
    }
    // 역할 분기: influencers 행 있으면 인플루언서, 없으면 브랜드(/dashboard).
    // 인플루언서는 프로필 미완성(채널 없음)이면 작성 유도(/me), 완성이면 /campaigns.
    const { data: inf } = await supabase.from("influencers").select("id, channels").eq("id", data.user!.id).maybeSingle();
    if (!inf) {
      router.push("/dashboard");
    } else {
      const incomplete = !Array.isArray(inf.channels) || inf.channels.length === 0;
      router.push(incomplete ? "/me" : "/campaigns");
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <a href="/" className="mb-8 flex justify-center">
          <img src="/repitch_wordmark_alpha.png" alt="repitch" className="h-7 w-auto dark:invert" />
        </a>
        <h1 className="text-xl font-semibold tracking-tight">로그인</h1>
        <p className="mt-1 text-sm text-muted-foreground">브랜드 계정으로 로그인해 주세요.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-[13px]">이메일</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="brand@company.com"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-[13px]">비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl"
            />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="h-11 rounded-full font-bold">
            {loading ? "로그인 중…" : "로그인"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          아직 계정이 없으신가요?{" "}
          <a href="/signup" className="font-semibold text-foreground underline underline-offset-2">
            가입 신청
          </a>
        </p>
      </div>
    </div>
  );
}
