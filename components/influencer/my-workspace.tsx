"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ApplicationsList } from "@/components/influencer/my-applications";
import { SentProposalsList } from "@/components/influencer/my-sent";
import type { MyApplicationRow, MySentProposalRow } from "@/components/influencer/types";

export function MyWorkspace({
  applications,
  proposals,
  initialTab,
}: {
  applications: MyApplicationRow[];
  proposals: MySentProposalRow[];
  initialTab: "applications" | "proposals";
}) {
  const [tab, setTab] = useState<"applications" | "proposals">(initialTab);

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">내 활동</h1>
      <p className="mt-1 text-sm text-muted-foreground">지원·제안 진행 상태예요.</p>

      <div className="mt-4 flex rounded-full border border-border p-0.5">
        {([["applications", `지원 ${applications.length}`], ["proposals", `보낸 제안 ${proposals.length}`]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn("flex-1 rounded-full py-1.5 text-sm font-medium transition-colors", tab === k ? "bg-foreground text-background" : "text-muted-foreground")}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "applications" ? <ApplicationsList rows={applications} /> : <SentProposalsList rows={proposals} />}
      </div>
    </div>
  );
}
