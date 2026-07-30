// 커머스 스냅샷 크론(하루 1회 새벽). Vercel Cron이 Authorization: Bearer $CRON_SECRET로 호출.
// visible 또는 캠페인 연결된 제품 중 product_url 있는 것을 순회 수집·저장(저부하: 요청 간 지연).
// 서버(비유저) 실행이라 RLS 우회를 위해 service_role 클라이언트 사용.
// ⚠️ 쿠팡/네이버 서버 IP 차단으로 대부분 결측(정상). 실값은 v2 판매자 연동/프록시로.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchSnapshot } from "@/lib/commerce";

export const maxDuration = 60;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: Request) {
  // 보호 — CRON_SECRET 미설정이거나 헤더 불일치면 거부.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    // 스켈레톤 — 서비스 롤 키 미설정 시 안전하게 no-op(크론 인증만 검증됨).
    return NextResponse.json({ ok: true, skipped: "SUPABASE_SERVICE_ROLE_KEY 미설정 — 수집 생략" });
  }
  const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 대상: product_url 있는 제품 중 visible=true 또는 캠페인에 연결된 것.
  const [{ data: withUrl }, { data: camps }] = await Promise.all([
    svc.from("products").select("id, product_url, visible").not("product_url", "is", null),
    svc.from("campaigns").select("product_id").not("product_id", "is", null),
  ]);
  const campaignProductIds = new Set((camps ?? []).map((c) => c.product_id));
  const targets = (withUrl ?? []).filter((p) => p.visible || campaignProductIds.has(p.id));

  const captured_at = new Date().toISOString().slice(0, 10);
  let collected = 0;
  let skipped = 0;
  for (const p of targets) {
    const result = await fetchSnapshot(p.product_url as string);
    if (result) {
      await svc.from("product_snapshots").upsert(
        { product_id: p.id, captured_at, source: result.source, ...result.data },
        { onConflict: "product_id,captured_at" },
      );
      collected++;
    } else {
      skipped++; // 차단/결측 — 그날은 구멍(정상)
    }
    await sleep(1500); // 저부하 — 요청 간 지연
  }

  return NextResponse.json({ ok: true, targets: targets.length, collected, skipped });
}
