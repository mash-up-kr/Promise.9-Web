import type { LinkUrlRejectReason } from "./link.utils";

/** 링크를 저장하지 못한 이유 — 앱·웹·익스텐션이 사용자에게 그대로 보여주는 문구. */
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
