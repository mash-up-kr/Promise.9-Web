import type { Href } from "expo-router";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ARCHIVE: "/archive",
  SETTINGS: "/settings",
  SEARCH: "/search",
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

/**
 * 공유 익스텐션 → 앱 인계 경로(스킴 뒤, 선행 슬래시 없음). 로그인 화면이 `next` 로
 * 인앱 저장 시트(`url` 프리필)까지 이어준다 — iOS 카카오처럼 익스텐션 안에서 끝낼 수 없는 로그인용.
 */
export function shareLoginHandoffPath(sharedUrl: string): string {
  const next = `${ROUTES.CREATE_LINK}?url=${encodeURIComponent(sharedUrl)}`;
  return `login?next=${encodeURIComponent(next)}`;
}

// 로그인 후 이동 대상은 앱 내부 경로만 — 외부 URL·프로토콜 상대 경로는 홈으로 대체한다.
export function isInternalHref(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  );
}
