import type { LinkUrlRejectReason } from "@shared/link/link.utils";

/**
 * 저장 직후 서버가 제목·썸네일·요약을 채우는 동안의 재조회 정책 — 홈 목록과 링크 상세가 함께 쓴다.
 *
 * 둘 다 `processingStatus` 가 PENDING 인 동안만 조회한다. 상태가 끝내 확정되지 않는 경우를 대비해
 * 저장 시각 상한을 두어, 그런 링크 하나로 폴링이 영원히 멈추지 않는 일을 막는다.
 */
export const LINK_PROCESSING = {
  /** 처리 중인 링크가 보이는 동안 다시 조회하는 간격(ms) */
  pollIntervalMs: 10_000,
  /** 저장 시각으로부터 이 시간이 지나면 더 이상 처리 중으로 보지 않는다(ms). 실제 처리는 보통 5초 내. */
  maxWaitMs: 2 * 60_000,
} as const;

/** 링크를 저장하지 못한 이유 — 사용자에게 그대로 보여주는 문구. */
export const LINK_URL_ERROR_MESSAGES: Record<LinkUrlRejectReason, string> = {
  empty: "링크 주소를 입력해주세요",
  "not-link": "올바른 링크 주소가 아니에요",
  whitespace: "링크 주소에 공백이 들어 있어요",
  "invisible-char": "링크 주소에 보이지 않는 문자가 섞여 있어요",
  "blocked-scheme": "보안상 저장할 수 없는 형식의 링크예요",
  userinfo: "보안상 계정 정보(@)가 담긴 링크는 저장할 수 없어요",
  "too-long": "링크 주소는 최대 2,048자까지 저장할 수 있어요",
  "not-found": "공유한 내용에서 링크 주소를 찾지 못했어요",
};
