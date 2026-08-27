/**
 * 리마인드 타입 — `POST /links` 의 `remindType` 으로 전송되는 서버 계약 값이다.
 *
 * 사용자에게 보이는 문구(`REMIND_LABELS`)는 화면 정책이라 `features/link` 가 갖는다.
 */
export const REMIND_TYPES = {
  soon: "soon",
  later: "later",
  reference: "reference",
} as const;

export type RemindType = keyof typeof REMIND_TYPES;
