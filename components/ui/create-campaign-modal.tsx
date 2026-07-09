"use client";
import React from "react";
import { CalendarDays, ChevronLeft, FileUp } from "lucide-react";
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
import type { Campaign } from "@/components/dashboard/seed-campaigns";

// 생성 위저드 — 기능명세서 5.3의 4단계 구조. 데모: 서버 저장 없이 완료 시
// 리스트에 메모리 추가(워크스페이스 생성 모달과 같은 패턴).

type Platform = "instagram" | "youtube";
type Draft = {
  product: string;
  category: string;
  intro: string;
  ages: string[];
  gender: string;
  headcount: string;
  platforms: Platform[];
  provision: string;
  quantity: string;
  trial: string;
  start: string;
  end: string;
};

const EMPTY: Draft = {
  product: "", category: "", intro: "",
  ages: [], gender: "", headcount: "", platforms: [],
  provision: "", quantity: "", trial: "", start: "", end: "",
};

const GENDERS = ["여성", "남성", "무관"];
const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
];
const PROVISIONS = ["제품 무상 제공", "구매 지원"];
// 체험 기간 — C1 지표 구간과 정렬(체험 기간이 길수록 진정성 근거가 강함).
const TRIAL_PERIODS = ["2주", "1개월", "2개월"];

const STEPS = [
  { title: "제품 정보", desc: "어떤 제품으로 체험단을 여나요?" },
  { title: "모집 조건", desc: "어떤 크리에이터를 모집할까요?" },
  { title: "제공 내역", desc: "무엇을, 얼마 동안 제공하나요?" },
  { title: "확인", desc: "입력한 내용을 확인해 주세요." },
];

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}

const fmtMD = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${+m}/${+d}`;
};
const fmtDot = (iso: string) => iso.replaceAll("-", ".");

export function CreateCampaignModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (c: Campaign) => void;
}) {
  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [pdfHint, setPdfHint] = React.useState(false);
  const [calOpen, setCalOpen] = React.useState(false);

  // Reset every time it opens (demo — no persistence). Closing via ESC/overlay
  // needs no confirmation. 캠페인 기간 기본값 = 오늘 ~ +30일.
  React.useEffect(() => {
    if (open) {
      const t = today(getLocalTimeZone());
      setStep(0);
      setDraft({ ...EMPTY, start: t.toString(), end: t.add({ days: 30 }).toString() });
      setPdfHint(false);
      setCalOpen(false);
    }
  }, [open]);

  const rangeValue =
    draft.start && draft.end
      ? { start: parseDate(draft.start), end: parseDate(draft.end) }
      : null;
  const minDate: DateValue = today(getLocalTimeZone());

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const toggle = <K extends "ages" | "platforms">(k: K, v: Draft[K][number]) =>
    setDraft((d) => {
      const arr = d[k] as string[];
      return { ...d, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  const valid = [
    draft.product.trim() !== "" && draft.category !== "",
    draft.ages.length > 0 && draft.gender !== "" && Number(draft.headcount) > 0 && draft.platforms.length > 0,
    draft.provision !== "" && Number(draft.quantity) > 0 && draft.trial !== "" && draft.start !== "" && draft.end !== "",
    true,
  ];
  const canProceed = valid[step];

  const submit = () => {
    const campaign: Campaign = {
      id: `custom-${Date.now()}`,
      product: draft.product.trim(),
      offer: `${draft.product.trim()} · ${draft.quantity}개`,
      period: `${fmtMD(draft.start)} – ${fmtMD(draft.end)}`,
      status: "진행 중",
      funnel: { applied: 0, selected: 0, shipped: 0, trialing: 0, proposals: 0 },
      creators: [],
      posts: [],
    };
    onCreate(campaign);
  };

  const platformLabel = draft.platforms.map((p) => (p === "instagram" ? "IG" : "YT")).join("·");

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg md:rounded-2xl md:border-0 md:shadow-xl">
        <ModalHeader className="gap-3 border-b-0 bg-transparent pr-10 text-left">
          {/* Progress — 4 segments filled up to the current step */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-foreground" : "bg-muted")}
              />
            ))}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            STEP {step + 1}/4
          </div>
          <ModalTitle className="text-xl font-semibold">{STEPS[step].title}</ModalTitle>
          <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
        </ModalHeader>

        <ModalBody className="max-h-[62vh] space-y-5 overflow-y-auto px-4 pb-2 md:px-6">
          {step === 0 && (
            <>
              {/* Placeholder for LLM plan-parsing — 실서비스: 기획서 PDF → 필드 자동 채움. UI만. */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPdfHint(true)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <FileUp className="size-3.5" /> 기획서 PDF로 자동 입력
                </button>
                {pdfHint && <span className="text-xs text-muted-foreground">곧 제공 예정이에요.</span>}
              </div>
              <Field label="제품명 *">
                <Input
                  placeholder="예: 데일리 토너 체험단"
                  value={draft.product}
                  onChange={(e) => set("product", e.target.value)}
                  className="rounded-xl focus-visible:border-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
              </Field>
              <Field label="카테고리 *">
                <div className="flex flex-wrap gap-2">
                  {BRAND_CATEGORIES.map((c) => (
                    <Chip key={c} label={c} active={draft.category === c} onClick={() => set("category", c)} />
                  ))}
                </div>
              </Field>
              <Field label="제품 한 줄 소개">
                <Input
                  placeholder="예: 각질 정리에 좋은 저자극 토너"
                  value={draft.intro}
                  onChange={(e) => set("intro", e.target.value)}
                  className="rounded-xl focus-visible:border-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="타겟 연령 *">
                <div className="flex flex-wrap gap-2">
                  {BRAND_AGE_GROUPS.map((a) => (
                    <Chip key={a} label={a} active={draft.ages.includes(a)} onClick={() => toggle("ages", a)} />
                  ))}
                </div>
              </Field>
              <Field label="성별 *">
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map((g) => (
                    <Chip key={g} label={g} active={draft.gender === g} onClick={() => set("gender", g)} />
                  ))}
                </div>
              </Field>
              <Field label="모집 인원 *">
                <Input
                  type="number"
                  min={1}
                  placeholder="예: 12"
                  value={draft.headcount}
                  onChange={(e) => set("headcount", e.target.value)}
                  className="rounded-xl focus-visible:border-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </Field>
              <Field label="플랫폼 *">
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <Chip key={p.key} label={p.label} active={draft.platforms.includes(p.key)} onClick={() => toggle("platforms", p.key)} />
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="체험 제공 방식 *">
                <div className="flex flex-wrap gap-2">
                  {PROVISIONS.map((p) => (
                    <Chip key={p} label={p} active={draft.provision === p} onClick={() => set("provision", p)} />
                  ))}
                </div>
              </Field>
              <Field label="제공 수량 *">
                <Input
                  type="number"
                  min={1}
                  placeholder="예: 1"
                  value={draft.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  className="rounded-xl focus-visible:border-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </Field>
              <Field label="체험 기간 *">
                <div className="flex flex-wrap gap-2">
                  {TRIAL_PERIODS.map((t) => (
                    <Chip key={t} label={t} active={draft.trial === t} onClick={() => set("trial", t)} />
                  ))}
                </div>
              </Field>
              <Field label="캠페인 기간 *">
                <button
                  type="button"
                  onClick={() => setCalOpen((o) => !o)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors",
                    calOpen ? "border-foreground/40" : "border-border hover:border-foreground/30",
                  )}
                >
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                  {draft.start && draft.end ? (
                    <span>{fmtDot(draft.start)} ~ {fmtDot(draft.end)}</span>
                  ) : (
                    <span className="text-muted-foreground">기간 선택</span>
                  )}
                </button>
                {calOpen && (
                  <div className="flex justify-center rounded-xl border border-border p-3">
                    <RangeCalendar
                      minValue={minDate}
                      value={rangeValue}
                      onChange={(v) =>
                        v && setDraft((d) => ({ ...d, start: v.start.toString(), end: v.end.toString() }))
                      }
                    />
                  </div>
                )}
              </Field>
            </>
          )}

          {step === 3 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <SummaryRow label="제품명" value={draft.product} />
              <SummaryRow label="카테고리" value={draft.category} />
              {draft.intro && <SummaryRow label="소개" value={draft.intro} />}
              <SummaryRow label="타겟 연령" value={draft.ages.join(", ")} />
              <SummaryRow label="성별" value={draft.gender} />
              <SummaryRow label="모집 인원" value={`${draft.headcount}명`} />
              <SummaryRow label="플랫폼" value={platformLabel} />
              <SummaryRow label="제공" value={`${draft.provision} · ${draft.quantity}개`} />
              <SummaryRow label="체험 기간" value={draft.trial} />
              <SummaryRow label="캠페인 기간" value={`${fmtMD(draft.start)} – ${fmtMD(draft.end)}`} last />
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex-row gap-2.5 border-t-0 bg-transparent px-4 pb-4 md:px-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex h-11 items-center gap-1 rounded-full border border-border px-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> 이전
            </button>
          )}
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => (step === 3 ? submit() : setStep((s) => s + 1))}
            className="h-11 flex-1 rounded-full bg-foreground text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted"
          >
            {step === 3 ? "캠페인 열기" : "다음"}
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
