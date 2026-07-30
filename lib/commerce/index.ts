// 커머스 성과 수집 — 교체 가능 모듈.
// 공통 인터페이스: fetchSnapshot(url) → CommerceSnapshot | null (실패 시 null = 조용한 스킵).
// 소스별 어댑터(coupang/naver)는 상품 페이지 HTML을 파싱. 저부하 원칙(요청 1회·일반 UA).
//
// ⚠️ 현실: 쿠팡/네이버는 데이터센터/서버 IP 직접 요청을 차단(403/418/로그인 리다이렉트)한다.
//    우회는 구현하지 않는다(정책). 따라서 서버에서 이 어댑터는 대부분 null(그날 결측)이며
//    그것이 정상 동작이다(UI는 이 빠진 그래프로 표시). 실값이 필요하면 소스만 교체:
//    - v2: 판매자 연동(네이버 커머스 API·카페24 OAuth)로 매출·주문 자동 수집
//    - 또는 합법적 서드파티 프록시를 fetchHtml에 주입(아래 fetchHtml 한 곳만 교체)
import { parseCoupang } from "./coupang";
import { parseNaver } from "./naver";

export type CommerceSnapshot = { rank?: number; review_count?: number; rating?: number; price?: number };
export type CommerceSource = "coupang" | "naver" | "manual";

// 일반 브라우저 UA · 단일 요청 · 짧은 타임아웃. 우회/로그인/대량요청 없음.
// 서드파티 프록시 전환 시 여기 한 곳만 교체(예: `${PROXY}${encodeURIComponent(url)}`).
export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null; // 403/418 등 차단 → 조용히 스킵
    return await res.text();
  } catch {
    return null; // 네트워크/타임아웃 → 조용히 스킵
  }
}

export function sourceForUrl(url: string): CommerceSource | null {
  try {
    const host = new URL(url).hostname;
    if (host.includes("coupang.")) return "coupang";
    if (host.includes("naver.")) return "naver";
    return null;
  } catch {
    return null;
  }
}

// 소스 판별 → 어댑터 파싱. 값이 하나도 없으면 null(결측).
export async function fetchSnapshot(url: string): Promise<{ source: CommerceSource; data: CommerceSnapshot } | null> {
  const source = sourceForUrl(url);
  if (!source) return null;
  const html = await fetchHtml(url);
  if (!html) return null;
  const data = source === "coupang" ? parseCoupang(html) : parseNaver(html);
  const hasValue = data.rank != null || data.review_count != null || data.rating != null || data.price != null;
  return hasValue ? { source, data } : null;
}

// ── 공통 JSON-LD 파서 — Schema.org Product(aggregateRating·offers). 두 사이트 공통 근간. ──
// (사이트가 구조를 바꿔도 JSON-LD는 비교적 안정적. 사이트 고유 파싱은 각 어댑터에서.)
export function parseJsonLd(html: string): CommerceSnapshot {
  const out: CommerceSnapshot = {};
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let json: unknown;
    try { json = JSON.parse(m[1].trim()); } catch { continue; }
    for (const node of flatten(json)) {
      const t = node["@type"];
      const isProduct = t === "Product" || (Array.isArray(t) && t.includes("Product"));
      if (!isProduct) continue;
      const agg = node.aggregateRating as Record<string, unknown> | undefined;
      if (agg) {
        const rating = num(agg.ratingValue);
        const rc = num(agg.reviewCount ?? agg.ratingCount);
        if (rating != null && out.rating == null) out.rating = rating;
        if (rc != null && out.review_count == null) out.review_count = rc;
      }
      const price = offerPrice(node.offers);
      if (price != null && out.price == null) out.price = price;
    }
  }
  return out;
}

// JSON-LD가 @graph/배열로 감싸인 경우까지 평탄화.
function flatten(json: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      out.push(o);
      if (Array.isArray(o["@graph"])) (o["@graph"] as unknown[]).forEach(walk);
    }
  };
  walk(json);
  return out;
}

function offerPrice(offers: unknown): number | undefined {
  for (const o of Array.isArray(offers) ? offers : [offers]) {
    if (o && typeof o === "object") {
      const p = num((o as Record<string, unknown>).price ?? (o as Record<string, unknown>).lowPrice);
      if (p != null) return p;
    }
  }
  return undefined;
}

export function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(String(v).replace(/[,\s원₩]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
