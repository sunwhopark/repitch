import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/live/empty-state";
import { CAMPAIGN_STATUS_LABEL } from "@/components/dashboard/live/types";

// 홈 — 실데이터로 계산 가능한 것만(진행 중 캠페인 수). 도달·참여율·광고비·역제안은
// 데이터 연동(Phase 2-C/3) 후 제공.
export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("campaigns")
    .select("id, goal, status, recruit_count, product:products(name)")
    .eq("brand_id", user!.id)
    .order("created_at", { ascending: false });

  // Supabase는 to-one 임베드를 타입상 배열로 추론하지만 런타임은 객체 → unknown 경유 캐스트.
  const campaigns = (data ?? []) as unknown as {
    id: string; goal: string | null; status: "draft" | "active" | "ended"; recruit_count: number | null;
    product: { name: string } | null;
  }[];
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  const deferred = [
    { label: "이번 달 역제안", note: "인플루언서 가입 후 집계" },
    { label: "이번 달 도달", note: "데이터 연동 후 제공" },
    { label: "평균 참여율", note: "데이터 연동 후 제공" },
    { label: "광고비 집행", note: "데이터 연동 후 제공" },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">브랜드 캠페인 현황이에요.</p>

        {/* 스탯 — 진행 중 캠페인만 실집계, 나머지는 연동 후 */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border md:grid-cols-5 md:divide-y-0">
          <a href="/dashboard/campaigns" className="col-span-2 bg-foreground p-4 text-background transition-colors hover:bg-foreground/90 md:col-span-1">
            <div className="text-sm opacity-70">진행 중 캠페인</div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums">{activeCount}</div>
            <div className="mt-2 text-xs opacity-70">캠페인 관리로 →</div>
          </a>
          {deferred.map((s) => (
            <div key={s.label} className="p-4">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-1.5 text-xl font-bold tracking-tight text-muted-foreground/50">—</div>
              <div className="mt-2 text-xs text-muted-foreground">{s.note}</div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Megaphone}
              title="아직 캠페인이 없어요"
              description="첫 캠페인을 만들면 여기에 현황과 성과가 모여요."
              action={
                <a href="/dashboard/campaigns" className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:bg-foreground/90">
                  캠페인 만들기
                </a>
              }
            />
          </div>
        ) : (
          <section className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <div className="px-5 pt-5">
              <h2 className="text-sm font-bold">캠페인별 성과</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">성과 수치(도달·참여율·집행)는 데이터 연동 후 제공됩니다.</p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 pl-5 text-left font-medium">캠페인</th>
                    <th className="py-2 pr-3 text-left font-medium">상태</th>
                    <th className="py-2 pr-3 text-right font-medium">모집</th>
                    <th className="py-2 pr-3 text-right font-medium">도달</th>
                    <th className="py-2 pr-5 text-right font-medium">집행</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-b-0">
                      <td className="py-2.5 pl-5">
                        <a href={`/dashboard/campaigns/${c.id}`} className="font-medium hover:underline">{c.product?.name ?? c.goal ?? "캠페인"}</a>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{CAMPAIGN_STATUS_LABEL[c.status]}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{c.recruit_count ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right text-muted-foreground/50">—</td>
                      <td className="py-2.5 pr-5 text-right text-muted-foreground/50">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
