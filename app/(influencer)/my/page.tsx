import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyApplications } from "@/components/influencer/my-applications";
import type { MyApplicationRow } from "@/components/influencer/types";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: inf } = await supabase.from("influencers").select("id").eq("id", user.id).maybeSingle();
  if (!inf) redirect("/dashboard");

  const { data } = await supabase.rpc("get_my_applications");
  return <MyApplications rows={(data ?? []) as MyApplicationRow[]} />;
}
