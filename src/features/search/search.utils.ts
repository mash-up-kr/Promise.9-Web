import { SEARCH_POLICY } from "./search.constants";

/** 검색 실행 시 최근 검색어 갱신 — 맨 앞 삽입, 중복은 앞으로 이동, 최대 N개. */
export function addRecentKeyword(
  keywords: string[],
  keyword: string,
): string[] {
  const trimmed = keyword.trim();
  if (trimmed === "") {
    return keywords;
  }

  return [trimmed, ...keywords.filter((item) => item !== trimmed)].slice(
    0,
    SEARCH_POLICY.recentKeywords.max,
  );
}
