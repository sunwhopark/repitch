"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONSENT_PRIVACY, CONSENT_MARKETING, LEGAL_ROUTES } from "@/lib/legal";
import { ConsentRow, Field, SignupFrame } from "@/components/auth/signup-shared";

export function InfluencerSignup({ onBack }: { onBack: () => void }) {
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = /.+@.+\..+/.test(email);
  const canSubmit = emailOk && password.length >= 8 && displayName.trim() !== "" && agreedTerms && agreedPrivacy;

  async function submit() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "influencer",
          display_name: displayName.trim(),
          agreed_terms: agreedTerms,
          agreed_privacy: agreedPrivacy,
          marketing_opt_in: marketingOptIn,
        },
      },
    });
    if (error) {
      setError(error.message.toLowerCase().includes("already registered") ? "이미 가입된 이메일이에요. 로그인해 주세요." : error.message);
      setLoading(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <div className="w-full max-w-sm">
          <CheckCircle2 className="mx-auto size-12" strokeWidth={1.5} />
          <h1 className="mt-5 text-xl font-semibold tracking-tight">가입 완료!</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            입력하신 이메일로 확인 메일을 보냈어요. 메일 확인 후 로그인하면 바로 캠페인을 둘러보고 지원할 수 있어요.
          </p>
          <a href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold text-background hover:bg-foreground/90">
            로그인 화면으로
          </a>
        </div>
      </div>
    );
  }

  return (
    <SignupFrame>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> 역할 선택
      </button>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">인플루언서 계정 만들기</h1>
      <p className="mt-1 text-sm text-muted-foreground">가입하면 바로 캠페인에 지원할 수 있어요.</p>
      <div className="mt-6 grid gap-4">
        <Field label="이메일"><Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="me@email.com" className="rounded-xl" /></Field>
        <Field label="비밀번호" help="8자 이상"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" /></Field>
        <Field label="활동명"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="예: 서연뷰티" className="rounded-xl" /></Field>
        <div className="grid gap-3 rounded-xl border border-border p-3.5">
          <ConsentRow checked={agreedTerms} onChange={setAgreedTerms}>
            <span className="font-medium text-foreground">(필수)</span>{" "}
            <a href={LEGAL_ROUTES.terms} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-2">이용약관</a>에 동의합니다
          </ConsentRow>
          <ConsentRow checked={agreedPrivacy} onChange={setAgreedPrivacy}>
            <span className="font-medium text-foreground">(필수)</span> {CONSENT_PRIVACY.body}{" "}
            <a href={LEGAL_ROUTES.privacy} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-2">[개인정보 처리방침]</a>
          </ConsentRow>
          <ConsentRow checked={marketingOptIn} onChange={setMarketingOptIn}>
            <span className="font-medium text-foreground">(선택)</span> {CONSENT_MARKETING.body}
          </ConsentRow>
        </div>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <Button type="button" disabled={!canSubmit || loading} onClick={submit} className="h-11 rounded-full font-bold">{loading ? "가입 중…" : "가입하기"}</Button>
      </div>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        이미 계정이 있으신가요? <a href="/login" className="font-semibold text-foreground underline underline-offset-2">로그인</a>
      </p>
    </SignupFrame>
  );
}
