import { createClient } from "@supabase/supabase-js";

// Browser-only client. Uses the public anon key (never service_role) — RLS on
// proposal_submissions allows anon INSERT (with consent) and blocks reads.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env var.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
