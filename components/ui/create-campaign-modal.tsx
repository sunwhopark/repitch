"use client";
import React from "react";
import { CalendarDays, ChevronLeft, FileUp, ImagePlus, Plus, X } from "lucide-react";
import {
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue,
} from "@internationalized/date";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { RangeCalendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_AGE_GROUPS, BRAND_CATEGORIES } from "@/lib/brand-application-options";
import type { Campaign, CampaignForm } from "@/components/dashboard/seed-campaigns";

// 생성 위저드 — 기획 접수 폼 기준 6단계. 데모: 서버 저장 없이 완료 시 리스트에
// 메모리 추가. 브랜드명·담당자·연락처는 가입 데이터라 여기서 제외(기획 코멘트).

type Draft = CampaignForm;

const GENDERS = ["여성", "남성", "무관"];
const GOALS = ["브랜드·제품 인지도 확대", "신뢰도·후기 확보", "구매 전환", "아직 모름"];
const BUDGET_SPLITS = ["한 명에게 집중 (임팩트형)", "여러 명에게 분산 (도달형)", "추천받고 싶어요"];
const LANGUAGES = ["한국", "일본", "미국/영어권", "기타"];
const PLATFORMS = ["Instagram", "YouTube", "틱톡", "상관없음"];
const CONTENT_TYPES = ["숏폼 (릴스·쇼츠·틱톡)", "피드 게시물", "롱폼 리뷰 영상", "스토리", "추천받고 싶어요"];
const SIZE_RANGES = ["1천 이하", "1천~1만", "1만~10만", "10만 이상", "상관없음"];
const STYLES = ["감성·분위기", "유머·친근", "전문·정보", "트렌디·감도", "비주얼 강점", "상관없음"];
const PROVISIONS = ["제품 무상 제공", "특가 제공"];
const TRIAL_OPTIONS = ["1주", "2주", "3주", "4주", "기타"];

const STEPS = [
  { title: "제품 정보", desc: "어떤 제품으로 체험단을 여나요?" },
  { title: "목표·예산", desc: "이번 캠페인의 목표와 예산이에요." },
  { title: "모집 조건", desc: "어떤 크리에이터를 모집할까요?" },
  { title: "원하는 인플루언서", desc: "선호하는 결을 알려주세요. (선택)" },
  { title: "제공·일정", desc: "무엇을, 얼마 동안, 언제 진행하나요?" },
  { title: "확인", desc: "입력한 내용을 확인해 주세요." },
];

function defaultDraft(): Draft {
  const t = today(getLocalTimeZone());
  return {
    product: "", category: "", intro: "", imageUrl: undefined, productUrl: "",
    goal: "", budget: "", budgetSplit: "",
    ages: [], gender: "", languages: [], platforms: [], contentTypes: [], headcount: "",
    sizeRanges: [], styles: [], refAccounts: [], wantFeel: "", avoidType: "",
    provision: "제품 무상 제공", dealMode: "amount", dealValue: "", quantity: "1",
    trial: "2주", trialCustom: "", start: t.toString(), end: t.add({ days: 30 }).toString(),
    postStart: "", postTBD: false,
  };
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-[13px]">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls = "rounded-xl focus-visible:border-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0";
const fmtMD = (iso: string) => { const [, m, d] = iso.split("-"); return `${+m}/${+d}`; };

export function CreateCampaignModal({
  open,
  onOpenChange,
  onSubmit,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (c: Campaign) => void;
  initial?: Campaign;
}) {
  const isEdit = !!initial;
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(defaultDraft);
  const [pdfHint, setPdfHint] = React.useState(false);
  const [calOpen, setCalOpen] = React.useState(false);
  const [refInput, setRefInput] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setDraft(initial?.form ? { ...defaultDraft(), ...initial.form } : defaultDraft());
      setStep(0);
      setPdfHint(false);
      setCalOpen(false);
      setRefInput("");
    }
  }, [open, initial]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const toggle = (k: "ages" | "languages" | "platforms" | "contentTypes" | "sizeRanges" | "styles", v: string) =>
    setDraft((d) => {
      const arr = d[k];
      return { ...d, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  const rangeValue = draft.start && draft.end ? { start: parseDate(draft.start), end: parseDate(draft.end) } : null;
  const minDate: DateValue = today(getLocalTimeZone());

  const addRef = () => {
    const v = refInput.trim();
    if (!v || draft.refAccounts.length >= 3) return;
    set("refAccounts", [...draft.refAccounts, v.startsWith("@") ? v : `@${v}`]);
    setRefInput("");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) set("imageUrl", URL.createObjectURL(f)); // 실서비스: 스토리지 업로드 후 URL 저장
  };

  const valid = [
    draft.product.trim() !== "" && draft.category !== "",
    true,
    draft.ages.length > 0 && draft.gender !== "",
    true,
    draft.start !== "" && draft.end !== "",
    true,
  ];
  const canProceed = valid[step];

  const trialLabel = draft.trial === "기타" ? (draft.trialCustom ? `${draft.trialCustom}주` : "기타") : draft.trial;
  const dealLabel = draft.dealMode === "amount" ? `${draft.dealValue || 0}원 특가` : `${draft.dealValue || 0}% 할인`;

  const submit = () => {
    const base: Campaign = initial ?? {
      id: `custom-${Date.now()}`,
      product: "", offer: "", period: "", status: "진행 중",
      funnel: { applied: 0, selected: 0, shipped: 0, trialing: 0, proposals: 0 },
      creators: [], posts: [], custom: true,
    };
    const offer = draft.provision === "특가 제공"
      ? `${dealLabel} · ${draft.quantity || 1}개`
      : `${draft.product.trim()} · ${draft.quantity || 1}개`;
    onSubmit({
      ...base,
      product: draft.product.trim(),
      offer,
      period: `${fmtMD(draft.start)} – ${fmtMD(draft.end)}`,
      imageUrl: draft.imageUrl,
      form: draft,
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg md:rounded-2xl md:border-0 md:shadow-xl">
        <ModalHeader className="gap-3 border-b-0 bg-transparent pr-10 text-left">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-foreground" : "bg-muted")} />
            ))}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {isEdit ? `캠페인 수정 · ${step + 1}/6` : `STEP ${step + 1}/6`}
          </div>
          <ModalTitle className="text-xl font-semibold">{STEPS[step].title}</ModalTitle>
          <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
        </ModalHeader>

        <ModalBody className="max-h-[62vh] space-y-5 overflow-y-auto px-4 pb-2 md:px-6">
          {/* 1. 제품 정보 */}
          {step === 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {/* 실서비스: 기획서 PDF → LLM 파싱으로 필드 자동 채움. UI만. */}
                <button type="button" onClick={() => setPdfHint(true)} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <FileUp className="size-3.5" /> 기획서 PDF로 자동 입력
                </button>
                {pdfHint && <span className="text-xs text-muted-foreground">곧 제공 예정이에요.</span>}
              </div>
              <Field label="제품 이미지">
                {draft.imageUrl ? (
                  <div className="relative w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draft.imageUrl} alt="제품 미리보기" className="size-28 rounded-xl border border-border object-cover" />
                    <button type="button" onClick={() => set("imageUrl", undefined)} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-foreground text-background shadow">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex size-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-foreground/30">
                    <ImagePlus className="size-5" /> 이미지 선택
                    <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                  </label>
                )}
              </Field>
              <Field label="제품명 *">
                <Input placeholder="예: 데일리 토너 체험단" value={draft.product} onChange={(e) => set("product", e.target.value)} className={inputCls} autoFocus />
              </Field>
              <Field label="카테고리 *">
                <div className="flex flex-wrap gap-2">
                  {BRAND_CATEGORIES.map((c) => <Chip key={c} label={c} active={draft.category === c} onClick={() => set("category", c)} />)}
                </div>
              </Field>
              <Field label="제품 한 줄 소개">
                <Input placeholder="예: 각질 정리에 좋은 저자극 토너" value={draft.intro} onChange={(e) => set("intro", e.target.value)} className={inputCls} />
              </Field>
              <Field label="제품 상세 URL" hint="제품 페이지 연동 자리 (선택)">
                <Input placeholder="https://" value={draft.productUrl} onChange={(e) => set("productUrl", e.target.value)} className={inputCls} />
              </Field>
            </>
          )}

          {/* 2. 목표·예산 */}
          {step === 1 && (
            <>
              <Field label="캠페인 목표">
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => <Chip key={g} label={g} active={draft.goal === g} onClick={() => set("goal", g)} />)}
                </div>
              </Field>
              <Field label="총 예산 (원)">
                <Input type="number" min={0} inputMode="numeric" placeholder="예: 3000000" value={draft.budget} onChange={(e) => set("budget", e.target.value.replace(/[^0-9]/g, ""))} className={inputCls} />
              </Field>
              <Field label="예산 배분 방식">
                <div className="flex flex-wrap gap-2">
                  {BUDGET_SPLITS.map((b) => <Chip key={b} label={b} active={draft.budgetSplit === b} onClick={() => set("budgetSplit", b)} />)}
                </div>
              </Field>
            </>
          )}

          {/* 3. 모집 조건 */}
          {step === 2 && (
            <>
              <Field label="타겟 연령 *">
                <div className="flex flex-wrap gap-2">
                  {BRAND_AGE_GROUPS.map((a) => <Chip key={a} label={a} active={draft.ages.includes(a)} onClick={() => toggle("ages", a)} />)}
                </div>
              </Field>
              <Field label="성별 *">
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map((g) => <Chip key={g} label={g} active={draft.gender === g} onClick={() => set("gender", g)} />)}
                </div>
              </Field>
              <Field label="타겟 언어권">
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => <Chip key={l} label={l} active={draft.languages.includes(l)} onClick={() => toggle("languages", l)} />)}
                </div>
              </Field>
              <Field label="플랫폼">
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => <Chip key={p} label={p} active={draft.platforms.includes(p)} onClick={() => toggle("platforms", p)} />)}
                </div>
              </Field>
              <Field label="콘텐츠 형태">
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((t) => <Chip key={t} label={t} active={draft.contentTypes.includes(t)} onClick={() => toggle("contentTypes", t)} />)}
                </div>
              </Field>
              <Field label="모집 인원">
                <Input type="number" min={1} placeholder="예: 12" value={draft.headcount} onChange={(e) => set("headcount", e.target.value)} className={inputCls} />
              </Field>
            </>
          )}

          {/* 4. 원하는 인플루언서 */}
          {step === 3 && (
            <>
              <Field label="규모 구간">
                <div className="flex flex-wrap gap-2">
                  {SIZE_RANGES.map((s) => <Chip key={s} label={s} active={draft.sizeRanges.includes(s)} onClick={() => toggle("sizeRanges", s)} />)}
                </div>
              </Field>
              <Field label="선호 스타일">
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => <Chip key={s} label={s} active={draft.styles.includes(s)} onClick={() => toggle("styles", s)} />)}
                </div>
              </Field>
              <Field label="참고 계정" hint="@핸들 최대 3개 (선택)">
                <div className="flex gap-2">
                  <Input
                    placeholder="@handle"
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRef(); } }}
                    disabled={draft.refAccounts.length >= 3}
                    className={inputCls}
                  />
                  <button type="button" onClick={addRef} disabled={draft.refAccounts.length >= 3 || !refInput.trim()} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground disabled:opacity-40">
                    <Plus className="size-4" />
                  </button>
                </div>
                {draft.refAccounts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.refAccounts.map((h) => (
                      <span key={h} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                        {h}
                        <button type="button" onClick={() => set("refAccounts", draft.refAccounts.filter((x) => x !== h))}><X className="size-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="원하는 느낌 (선택)">
                <Input placeholder="예: 잔잔하고 신뢰감 있는 톤" value={draft.wantFeel} onChange={(e) => set("wantFeel", e.target.value)} className={inputCls} />
              </Field>
              <Field label="피하고 싶은 유형 (선택)">
                <Input placeholder="예: 과한 광고 톤" value={draft.avoidType} onChange={(e) => set("avoidType", e.target.value)} className={inputCls} />
              </Field>
            </>
          )}

          {/* 5. 제공·일정 */}
          {step === 4 && (
            <>
              <Field label="체험 제공 방식">
                <div className="flex flex-wrap gap-2">
                  {PROVISIONS.map((p) => <Chip key={p} label={p} active={draft.provision === p} onClick={() => set("provision", p)} />)}
                </div>
              </Field>
              {draft.provision === "특가 제공" && (
                <Field label="특가 방식" hint='예: "100원 특가" 또는 "90% 할인"'>
                  <div className="flex items-center gap-2">
                    <div className="flex shrink-0 rounded-full border border-border p-0.5">
                      <button type="button" onClick={() => set("dealMode", "amount")} className={cn("rounded-full px-3 py-1 text-xs font-medium", draft.dealMode === "amount" ? "bg-foreground text-background" : "text-muted-foreground")}>금액</button>
                      <button type="button" onClick={() => set("dealMode", "percent")} className={cn("rounded-full px-3 py-1 text-xs font-medium", draft.dealMode === "percent" ? "bg-foreground text-background" : "text-muted-foreground")}>할인율</button>
                    </div>
                    <Input type="number" min={0} inputMode="numeric" placeholder={draft.dealMode === "amount" ? "특가 금액" : "할인율"} value={draft.dealValue} onChange={(e) => set("dealValue", e.target.value.replace(/[^0-9]/g, ""))} className={inputCls} />
                    <span className="shrink-0 text-sm text-muted-foreground">{draft.dealMode === "amount" ? "원" : "%"}</span>
                  </div>
                </Field>
              )}
              <Field label="제공 수량">
                <Input type="number" min={1} placeholder="예: 1" value={draft.quantity} onChange={(e) => set("quantity", e.target.value)} className={inputCls} />
              </Field>
              <Field label="체험 기간">
                <div className="flex items-center gap-2">
                  <select value={draft.trial} onChange={(e) => set("trial", e.target.value)} className="h-10 rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:border-foreground/40">
                    {TRIAL_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {draft.trial === "기타" && (
                    <div className="flex items-center gap-1.5">
                      <Input type="number" min={1} placeholder="숫자" value={draft.trialCustom} onChange={(e) => set("trialCustom", e.target.value.replace(/[^0-9]/g, ""))} className={cn(inputCls, "w-24")} />
                      <span className="text-sm text-muted-foreground">주</span>
                    </div>
                  )}
                </div>
              </Field>
              <Field label="캠페인 기간" hint="인플루언서를 모집하는 기간을 말해요.">
                <button type="button" onClick={() => setCalOpen((o) => !o)} className={cn("flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors", calOpen ? "border-foreground/40" : "border-border hover:border-foreground/30")}>
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                  <span>{fmtMD(draft.start)} ~ {fmtMD(draft.end)}</span>
                </button>
                {calOpen && (
                  <div className="flex justify-center rounded-xl border border-border p-3">
                    <RangeCalendar minValue={minDate} value={rangeValue} onChange={(v) => v && setDraft((d) => ({ ...d, start: v.start.toString(), end: v.end.toString() }))} />
                  </div>
                )}
              </Field>
              <Field label="희망 콘텐츠 게시 시작일 (선택)">
                <Input type="date" value={draft.postStart} disabled={draft.postTBD} onChange={(e) => set("postStart", e.target.value)} className={cn(inputCls, draft.postTBD && "opacity-50")} />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={draft.postTBD} onChange={(e) => set("postTBD", e.target.checked)} className="size-4 accent-foreground" />
                  미정 / 상담 후 결정
                </label>
              </Field>
            </>
          )}

          {/* 6. 확인 */}
          {step === 5 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              {draft.imageUrl && (
                <div className="mb-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.imageUrl} alt="제품" className="size-24 rounded-xl border border-border object-cover" />
                </div>
              )}
              <SummaryRow label="제품명" value={draft.product} />
              <SummaryRow label="카테고리" value={draft.category} />
              {draft.intro && <SummaryRow label="소개" value={draft.intro} />}
              {draft.goal && <SummaryRow label="목표" value={draft.goal} />}
              {draft.budget && <SummaryRow label="예산" value={`${Number(draft.budget).toLocaleString()}원`} />}
              {draft.budgetSplit && <SummaryRow label="배분" value={draft.budgetSplit} />}
              <SummaryRow label="타겟 연령" value={draft.ages.join(", ")} />
              <SummaryRow label="성별" value={draft.gender} />
              {draft.languages.length > 0 && <SummaryRow label="언어권" value={draft.languages.join(", ")} />}
              {draft.platforms.length > 0 && <SummaryRow label="플랫폼" value={draft.platforms.join(", ")} />}
              {draft.contentTypes.length > 0 && <SummaryRow label="콘텐츠 형태" value={draft.contentTypes.join(", ")} />}
              {draft.headcount && <SummaryRow label="모집 인원" value={`${draft.headcount}명`} />}
              {draft.sizeRanges.length > 0 && <SummaryRow label="규모" value={draft.sizeRanges.join(", ")} />}
              {draft.styles.length > 0 && <SummaryRow label="스타일" value={draft.styles.join(", ")} />}
              {draft.refAccounts.length > 0 && <SummaryRow label="참고 계정" value={draft.refAccounts.join(" ")} />}
              <SummaryRow label="제공" value={`${draft.provision === "특가 제공" ? dealLabel : draft.provision} · ${draft.quantity || 1}개`} />
              <SummaryRow label="체험 기간" value={trialLabel} />
              <SummaryRow label="캠페인 기간" value={`${fmtMD(draft.start)} – ${fmtMD(draft.end)}`} />
              <SummaryRow label="게시 시작" value={draft.postTBD ? "미정 / 상담 후 결정" : draft.postStart || "—"} last />
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex-row gap-2.5 border-t-0 bg-transparent px-4 pb-4 md:px-6">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="flex h-11 items-center gap-1 rounded-full border border-border px-4 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="size-4" /> 이전
            </button>
          )}
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => (step === 5 ? submit() : setStep((s) => s + 1))}
            className="h-11 flex-1 rounded-full bg-foreground text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted"
          >
            {step === 5 ? (isEdit ? "저장" : "캠페인 열기") : "다음"}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", !last && "border-b border-dashed border-border")}>
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
