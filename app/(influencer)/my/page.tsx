import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyWorkspace } from "@/components/influencer/my-workspace";
import type { MyApplicationRow, MySentProposalRow } from "@/components/influencer/types";

export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: inf } = await supabase.from("influencers").select("id").eq("id", user.id).maybeSingle();
  if (!inf) redirect("/dashboard");

  const [{ data: apps }, { data: proposals }] = await Promise.all([
    supabase.rpc("get_my_applications"),
    supabase.rpc("get_my_proposals"),
  ]);

  return (
    <MyWorkspace
      applications={(apps ?? []) as MyApplicationRow[]}
      proposals={(proposals ?? []) as MySentProposalRow[]}
      initialTab={tab === "proposals" ? "proposals" : "applications"}
    />
  );
}
