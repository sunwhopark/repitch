import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Session refresh + route gate, called from proxy.ts (Next 16's renamed
// middleware). Runs on the Node.js runtime. Uses the request/response cookie
// APIs (not next/headers).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Must run getUser() immediately after client creation — no logic in between
  // (Supabase guidance: prevents random logouts from cookie desync).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 인증 필요: 브랜드 대시보드(/dashboard/*) + 인플루언서 인증 화면(/my, /me).
  // /campaigns(공개 카탈로그)·/login·/signup·/·/demo·/privacy·/terms 는 공개.
  const authRequired = path.startsWith("/dashboard") || path === "/my" || path === "/me";
  if (!user && authRequired) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  // (로그인/가입 후 라우팅은 역할 분기가 필요해 페이지에서 처리 — proxy에서 강제
  //  /dashboard 리다이렉트 없음)

  // IMPORTANT: return supabaseResponse so the refreshed Set-Cookie survives.
  return supabaseResponse;
}
