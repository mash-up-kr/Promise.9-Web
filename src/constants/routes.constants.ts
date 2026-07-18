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
