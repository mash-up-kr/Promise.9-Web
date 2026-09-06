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

/** 로그인 화면이 `next` 로 받는 인계 목적지 — 경로 문자열 대신 화이트리스트 키만 허용한다. */
export const SHARE_LOGIN_NEXT_CREATE_LINK = "create-link";

/**
 * 공유 익스텐션 → 앱 인계 경로(스킴 뒤, 선행 슬래시 없음). 로그인 화면이 `next` 를 보고
 * 인앱 저장 시트를 `share`(공유 URL) 로 채워 연다 — iOS 카카오처럼 익스텐션 안에서 끝낼 수 없는 로그인용.
 */
export function shareLoginHandoffPath(sharedUrl: string): string {
  return `login?next=${SHARE_LOGIN_NEXT_CREATE_LINK}&share=${encodeSharedUrl(sharedUrl)}`;
}

/**
 * 공유 URL 을 라우터 파라미터로 나르기 위한 UTF-8 바이트 16진수 인코딩.
 * expo-router 는 딥링크·href 의 파라미터를 여러 번 디코딩하고 다시 파싱하므로 `&`·`%`·`#` 가
 * 든 URL 은 percent-encoding 으로는 살아남지 못한다 — 0-9a-f 만 남기면 몇 번을 거쳐도 그대로다.
 */
export function encodeSharedUrl(url: string): string {
  const percentEncoded = encodeURIComponent(url);
  let hex = "";
  for (let i = 0; i < percentEncoded.length; i += 1) {
    if (percentEncoded[i] === "%") {
      hex += percentEncoded.slice(i + 1, i + 3).toLowerCase();
      i += 2;
    } else {
      hex += percentEncoded.charCodeAt(i).toString(16).padStart(2, "0");
    }
  }
  return hex;
}

export function decodeSharedUrl(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length % 2 !== 0
  ) {
    return null;
  }
  if (!/^[0-9a-f]+$/i.test(value)) {
    return null;
  }
  try {
    return decodeURIComponent(value.replace(/[0-9a-f]{2}/gi, "%$&"));
  } catch {
    return null;
  }
}
