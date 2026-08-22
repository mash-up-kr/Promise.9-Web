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
