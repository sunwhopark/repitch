import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client for authenticated pages (login/signup/dashboard).
// Cookie-based session so proxy.ts and the server client can read it.
// (The public landing forms still use the anon localStorage client in
// lib/supabase/client.ts — they only do anonymous inserts; migration deferred.)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
