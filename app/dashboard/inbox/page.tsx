import { createClient } from "@/lib/supabase/server";
import { getInboxItems } from "@/lib/dashboard/inbox-data";
import { InboxClient } from "@/components/dashboard/live/inbox-client";

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const items = await getInboxItems(supabase, user!.id);
  return <InboxClient items={items} brandId={user!.id} />;
}
