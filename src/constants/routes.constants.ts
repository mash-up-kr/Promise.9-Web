import type { Href } from "expo-router";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ARCHIVE: "/archive",
  SETTINGS: "/settings",
  SEARCH: "/search",
  SEARCH_CATEGORIES: "/search/categories",
  CREATE_LINK: "/create-link",
} as const satisfies Record<string, Href>;

export function archiveDetailHref(id: string) {
  return { pathname: "/archive/[id]", params: { id } } as const satisfies Href;
}

/**
 * 폴더 이동 시트 Href.
 *
 * 대상 링크는 쉼표로 이어 붙여 넘긴다 — 컨텍스트 메뉴(1개)와 선택 모드(N개)가 같은 시트를 연다.
 * `currentFolderId` 는 사용자 폴더 상세에서만 있다(시스템 폴더는 이동 대상이 아니다).
 */
export function moveLinksHref(
  linkIds: number[],
  currentFolderId?: string,
  title?: string,
) {
  return {
    pathname: "/move-links",
    params: {
      ids: linkIds.join(","),
      ...(currentFolderId && { folderId: currentFolderId }),
      ...(title && { title }),
    },
  } as const satisfies Href;
}

export function linkDetailHref(id: string) {
  return { pathname: "/link/[id]", params: { id } } as const satisfies Href;
}

/** 키워드를 넣은 검색 화면 — 검색 화면이 `q` 파라미터를 읽어 결과를 바로 보여준다. */
export function searchHref(keyword: string) {
  return {
    pathname: "/search",
    params: { q: keyword },
  } as const satisfies Href;
}
