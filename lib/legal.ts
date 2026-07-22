// 법적 문서 경로 + 동의 문구 단일 출처. 여러 폼(가입·입점·역제안 온보딩 등)에서
// 재사용. 동의 문구 ①②③은 확정본 verbatim — 임의 수정 금지.

export const LEGAL_ROUTES = {
  terms: "/terms",
  privacy: "/privacy",
} as const;

type Consent = {
  id: string;
  required: boolean;
  title: string;
  body: string;
};

// ① 개인정보 수집·이용 동의 (필수)
export const CONSENT_PRIVACY: Consent = {
  id: "privacy",
  required: true,
  title: "개인정보 수집·이용 동의",
  body: "Re:Pitch가 위 입력 정보를 서비스 제공(매칭·캠페인 운영·안내 연락) 목적으로 수집·이용하는 것에 동의합니다. 보유 기간: 회원 탈퇴 또는 목적 달성 시까지(상세는 개인정보 처리방침 참조). 동의를 거부할 수 있으나, 거부 시 서비스 이용이 제한됩니다.",
};

// ② 개인정보 제3자 제공 동의 (인플루언서 — 캠페인 신청·역제안 제출 시 필수)
export const CONSENT_THIRD_PARTY: Consent = {
  id: "third_party",
  required: true,
  title: "개인정보 제3자 제공 동의",
  body: "캠페인 참여 신청 및 역제안 전달을 위해, 내 채널 정보·제안 내용 및 (선정 시) 수령인 이름·연락처·배송지 주소가 해당 브랜드에 제공되는 것에 동의합니다. 제공받는 자: 내가 신청·제안한 캠페인의 브랜드 / 보유 기간: 캠페인 종료 후 90일.",
};

// ③ 마케팅 정보 수신 동의 (선택)
export const CONSENT_MARKETING: Consent = {
  id: "marketing",
  required: false,
  title: "마케팅 정보 수신 동의",
  body: "Re:Pitch의 서비스 소식, 신규 캠페인·혜택 안내를 이메일로 받는 것에 동의합니다. 동의하지 않아도 서비스 이용에 제한이 없으며, 언제든 수신을 거부할 수 있습니다.",
};

// 이용약관 동의 (필수) — 본문 문구 없이 /terms 링크로 대체.
export const CONSENT_TERMS: Pick<Consent, "id" | "required" | "title"> = {
  id: "terms",
  required: true,
  title: "이용약관 동의",
};
