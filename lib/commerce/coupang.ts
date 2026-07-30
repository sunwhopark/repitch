// 쿠팡 상품페이지 파서. 리뷰 수·평점·가격 우선(rank는 파싱 가능하면 옵션).
// ⚠️ 구조 변경 시 여기만 수정하면 됨(공통 JSON-LD는 lib/commerce/index.ts).
import { parseJsonLd, num, type CommerceSnapshot } from "./index";

export function parseCoupang(html: string): CommerceSnapshot {
  // 1) 안정적인 것 우선 — Schema.org JSON-LD(aggregateRating·offers).
  const out: CommerceSnapshot = { ...parseJsonLd(html) };

  // 2) 사이트 고유 폴백 — JSON-LD가 없을 때 meta/인라인 표기에서 보강.
  //    (쿠팡 마크업 변경 잦음 → 실패해도 결측 허용. 아래 정규식만 갱신.)
  if (out.price == null) {
    const meta = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([\d,]+)["']/i);
    if (meta) out.price = num(meta[1]);
  }
  if (out.review_count == null) {
    const rc = html.match(/"ratingCount"\s*:\s*"?(\d[\d,]*)"?/i) || html.match(/총\s*([\d,]+)\s*개[^<]*리뷰/);
    if (rc) out.review_count = num(rc[1]);
  }
  if (out.rating == null) {
    const rt = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/i);
    if (rt) out.rating = num(rt[1]);
  }
  // rank(카테고리 순위): 쿠팡 상품페이지에 '카테고리 N위' 표기가 있으면 추출(없으면 결측).
  const rk = html.match(/카테고리\s*(\d[\d,]*)\s*위/);
  if (rk) out.rank = num(rk[1]);

  return out;
}
