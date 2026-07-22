"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRAND_CATEGORIES } from "@/lib/brand-application-options";
import { CONSENT_PRIVACY, CONSENT_MARKETING, LEGAL_ROUTES } from "@/lib/legal";
import { recommendedWeights } from "@/lib/scoring/recommended-weights";
import { Chip, ConsentRow, Field, SignupFrame } from "@/components/auth/signup-shared";

const CREATOR_TYPES = ["실물", "버추얼", "상관없음"];
const GENDERS = ["여성", "남성", "상관없음"];
const COUNTRIES = ["대한민국", "미국", "일본"];

export function BrandSignup({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [category, setCategory] = useState("");
  const [creatorType, setCreatorType] = useState("");
  const [gender, setGender] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailOk = /.+@.+\..+/.test(email);
  const canStep1 = emailOk && password.length >= 8 && brandName.trim() !== "" && contactName.trim() !== "" && agreedTerms && agreedPrivacy;
  const canSubmit = category !== "" && creatorType !== "" && gender !== "" && countries.length > 0;

  const toggleCountry = (c: string) => setCountries((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  async function submit() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "brand",
          brand_name: brandName.trim(),
          contact_name: contactName.trim(),
          category,
          pref_creator_type: creatorType,
          pref_creator_gender: gender,
          target_countries: countries,
          agreed_terms: agreedTerms,
          agreed_privacy: agreedPrivacy,
          marketing_opt_in: marketingOptIn,
          weights: recommendedWeights(category),
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
          <h1 className="mt-5 text-xl font-semibold tracking-tight">가입이 접수되었어요</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            영업일 기준 1~3일 이내에 입력하신 이메일로 서비스 이용 안내를 보내드려요. 메일 확인 후 로그인하시면 대시보드를 이용하실 수 있어요.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-foreground/70">
            {category} 브랜드 추천 평가 설정이 적용됐어요 — 설정에서 조정할 수 있어요.
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
      <button type="button" onClick={step === 1 ? onBack : () => setStep(1)} className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {step === 1 ? "역할 선택" : "이전"}
      </button>
      <div className="mb-6 flex gap-1.5">
        {[1, 2].map((n) => (
          <span key={n} className={cn("h-1 flex-1 rounded-full transition-colors", n <= step ? "bg-foreground" : "bg-muted")} />
        ))}
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">STEP {step}/2</div>

      {step === 1 ? (
        <>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">브랜드 계정 만들기</h1>
          <p className="mt-1 text-sm text-muted-foreground">로그인에 사용할 정보를 입력해 주세요.</p>
          <div className="mt-6 grid gap-4">
            <Field label="이메일"><Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="brand@company.com" className="rounded-xl" /></Field>
            <Field label="비밀번호" help="8자 이상"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" /></Field>
            <Field label="브랜드명"><Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="예: 이니스프리" className="rounded-xl" /></Field>
            <Field label="담당자명"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="예: 김리피" className="rounded-xl" /></Field>
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
            <Button type="button" disabled={!canStep1} onClick={() => setStep(2)} className="h-11 rounded-full font-bold">다음</Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">브랜드 프로필</h1>
          <p className="mt-1 text-sm text-muted-foreground">매칭 정확도를 위해 알려주세요.</p>
          <div className="mt-6 grid gap-5">
            <Field label="주요 제품 카테고리"><div className="flex flex-wrap gap-2">{BRAND_CATEGORIES.map((c) => <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}</div></Field>
            <Field label="선호 크리에이터 유형"><div className="flex flex-wrap gap-2">{CREATOR_TYPES.map((c) => <Chip key={c} label={c} active={creatorType === c} onClick={() => setCreatorType(c)} />)}</div></Field>
            <Field label="선호 크리에이터 성별"><div className="flex flex-wrap gap-2">{GENDERS.map((g) => <Chip key={g} label={g} active={gender === g} onClick={() => setGender(g)} />)}</div></Field>
            <Field label="타겟 국가" help="복수 선택"><div className="flex flex-wrap gap-2">{COUNTRIES.map((c) => <Chip key={c} label={c} active={countries.includes(c)} onClick={() => toggleCountry(c)} />)}</div></Field>
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <Button type="button" disabled={!canSubmit || loading} onClick={submit} className="h-11 flex-1 rounded-full font-bold">{loading ? "가입 접수 중…" : "가입 신청"}</Button>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        이미 계정이 있으신가요? <a href="/login" className="font-semibold text-foreground underline underline-offset-2">로그인</a>
      </p>
    </SignupFrame>
  );
}
