// 네이버(스마트스토어·쇼핑) 상품페이지 파서. 리뷰 수·평점·가격 우선(rank 옵션).
// ⚠️ 구조 변경 시 여기만 수정하면 됨(공통 JSON-LD는 lib/commerce/index.ts).
import { parseJsonLd, num, type CommerceSnapshot } from "./index";

export function parseNaver(html: string): CommerceSnapshot {
  // 1) 안정적인 것 우선 — Schema.org JSON-LD.
  const out: CommerceSnapshot = { ...parseJsonLd(html) };

  // 2) 사이트 고유 폴백 — 스마트스토어는 __PRELOADED_STATE__/__NEXT_DATA__에 상품 정보를
  //    담는다. 큰 JSON에서 필드명으로 직접 추출(구조 변경 시 아래 키/정규식만 갱신).
  if (out.review_count == null) {
    const rc = html.match(/"reviewCount"\s*:\s*(\d+)/) || html.match(/"totalReviewCount"\s*:\s*(\d+)/);
    if (rc) out.review_count = num(rc[1]);
  }
  if (out.rating == null) {
    const rt = html.match(/"averageReviewScore"\s*:\s*([\d.]+)/) || html.match(/"reviewScore"\s*:\s*([\d.]+)/);
    if (rt) out.rating = num(rt[1]);
  }
  if (out.price == null) {
    const pr = html.match(/"salePrice"\s*:\s*(\d+)/) || html.match(/"lowPrice"\s*:\s*"?(\d+)"?/) || html.match(/"dispSalePrice"\s*:\s*(\d+)/);
    if (pr) out.price = num(pr[1]);
  }
  // rank: 네이버 상품페이지에는 카테고리 순위 표기가 일반적으로 없음 → 결측 허용.

  return out;
}
