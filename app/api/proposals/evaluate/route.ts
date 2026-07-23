// 진정성 평가 트리거 — 제출 인플루언서 본인 또는 대상 브랜드만.
// proposal 텍스트+채널 맥락 → Gemini 1회 호출(C2~C4) → set_auth_scores(definer)로 기록.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateAuthenticity, AUTH_MODEL } from "@/lib/gemini";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  let proposalId = "";
  try { proposalId = (await request.json())?.proposalId ?? ""; } catch { /* noop */ }
  if (!proposalId) return NextResponse.json({ error: "proposalId 필요" }, { status: 400 });

  // 읽기는 RLS로 이미 제한됨(대상 브랜드 or 본인 제출만 select 가능). 없으면 권한 없음/부재.
  const { data: p } = await supabase
    .from("proposal_submissions")
    .select("id, story_text, content_tone, platform, selected_categories, product_name, brand_name")
    .eq("id", proposalId)
    .maybeSingle();
  if (!p) return NextResponse.json({ error: "제안을 찾을 수 없거나 권한이 없어요." }, { status: 404 });

  const result = await evaluateAuthenticity({
    storyText: p.story_text ?? "",
    contentTone: p.content_tone ?? "",
    platform: p.platform ?? "",
    categories: p.selected_categories ?? [],
    productName: p.product_name ?? "",
    brandName: p.brand_name ?? "",
  });

  if ("error" in result) {
    // 실패 기록(재시도 가능). 기록 실패해도 응답은 에러.
    await supabase.rpc("set_auth_scores", { p_proposal_id: proposalId, p_scores: null, p_model: AUTH_MODEL, p_status: "failed" });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const { error: wErr } = await supabase.rpc("set_auth_scores", {
    p_proposal_id: proposalId,
    p_scores: result,
    p_model: AUTH_MODEL,
    p_status: "done",
  });
  if (wErr) return NextResponse.json({ error: "평가 저장 실패" }, { status: 500 });

  return NextResponse.json({ status: "done", auth_scores: result });
}
