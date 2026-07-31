import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyWorkspace } from "@/components/influencer/my-workspace";
import type { MyApplicationRow, MySentProposalRow, MyInvitationRow } from "@/components/influencer/types";

export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: inf } = await supabase
    .from("influencers")
    .select("id, ship_recipient, ship_phone, ship_address")
    .eq("id", user.id)
    .maybeSingle();
  if (!inf) redirect("/dashboard");

  const [{ data: apps }, { data: proposals }, { data: invitations }] = await Promise.all([
    supabase.rpc("get_my_applications"),
    supabase.rpc("get_my_proposals"),
    supabase.rpc("get_my_invitations"),
  ]);

  const initialTab = tab === "proposals" ? "proposals" : tab === "invitations" ? "invitations" : "applications";

  return (
    <MyWorkspace
      applications={(apps ?? []) as MyApplicationRow[]}
      proposals={(proposals ?? []) as MySentProposalRow[]}
      invitations={(invitations ?? []) as MyInvitationRow[]}
      ship={{ recipient: inf.ship_recipient, phone: inf.ship_phone, address: inf.ship_address }}
      initialTab={initialTab}
    />
  );
}
