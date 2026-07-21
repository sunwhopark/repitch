import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client (Server Components / Route Handlers / Server
// Actions). Reads the cookie session via Next 16's async cookies(). Auth code
// must prefer supabase.auth.getUser() over getSession() server-side — getUser()
// revalidates the JWT against the Auth server.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — cookies are read-only
            // there. Safe to ignore: proxy.ts refreshes the session cookie.
          }
        },
      },
    },
  );
}
