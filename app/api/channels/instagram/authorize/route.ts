// Instagram OAuth 시작 — 상태(state) 쿠키 설정 후 Meta 동의 화면으로 리다이렉트.
import { NextResponse, type NextRequest } from "next/server";
import { igAuthorizeUrl, igConfigured, igCallbackUri } from "@/lib/instagram";

export async function GET(req: NextRequest) {
  if (!igConfigured()) {
    return NextResponse.redirect(new URL("/me?ig=unconfigured", req.nextUrl.origin));
  }
  const state = crypto.randomUUID();
  const url = igAuthorizeUrl(igCallbackUri(req.nextUrl.origin), state);
  const res = NextResponse.redirect(url);
  // CSRF 방지 — 콜백에서 대조. httpOnly, 짧은 수명.
  res.cookies.set("ig_oauth_state", state, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
