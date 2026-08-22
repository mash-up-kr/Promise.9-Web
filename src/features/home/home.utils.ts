import type { HomeKeyword, RemindLink } from "./home.types";

/** 시안 정책 — 다시 볼 링크 최대 9개. */
export const HOME_REMIND_LINK_LIMIT = 9;
/** 시안 정책 — 많이 저장한 키워드 최대 12개(한 줄 6개 × 2줄). */
export const HOME_KEYWORD_LIMIT = 12;
/** 시안 정책 — 키워드로 셈하는 최소 링크 수. */
const KEYWORD_MIN_LINK_COUNT = 3;
/** 시안 정책 — 섹션을 띄우는 최소 키워드 종류 수. */
const KEYWORD_MIN_VARIETY = 3;

/** 알림이 가까운 순 상위 N개. 빈 배열이면 호출부가 섹션을 숨긴다. */
export function selectRemindLinks(links: RemindLink[]): RemindLink[] {
  return [...links]
    .sort((a, b) => Date.parse(a.reminderAt) - Date.parse(b.reminderAt))
    .slice(0, HOME_REMIND_LINK_LIMIT);
}

/**
 * 링크가 많은 순 상위 N개 키워드.
 *
 * 태그가 몇 개 안 붙은 초기 사용자에게 빈약한 섹션을 보여주지 않으려고, 링크 3개 이상인
 * 태그가 3종류 이상 모였을 때만 노출한다(시안 정책). 미달이면 빈 배열이라 섹션이 숨는다.
 */
export function selectTopKeywords(keywords: HomeKeyword[]): HomeKeyword[] {
  const eligible = keywords.filter(
    (keyword) => keyword.linkCount >= KEYWORD_MIN_LINK_COUNT,
  );

  if (eligible.length < KEYWORD_MIN_VARIETY) {
    return [];
  }

  return eligible
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, HOME_KEYWORD_LIMIT);
}
