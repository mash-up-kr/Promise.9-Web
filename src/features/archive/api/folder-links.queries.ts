import { type LinkListParams, linkQueries } from "@/entities/link/link.queries";

import { SYSTEM_FOLDERS } from "../archive.constants";
import type { LinkSortOption } from "../archive.types";

/**
 * 보관함 라우트 id 가 조회 가능한 폴더를 가리키는지.
 *
 * 딥링크·오타 URL(`/archive/foo`)로 들어오면 `Number(id)` 가 NaN 이 되어 그대로 서버로
 * 새어나가므로, 요청 전에 시스템 폴더 키이거나 양의 정수인지 확인한다.
 */
export function isFolderRouteId(id: string | undefined): id is string {
  if (!id) return false;
  if (SYSTEM_FOLDERS.some((folder) => folder.id === id)) return true;
  return /^[1-9]\d*$/.test(id);
}

/**
 * 보관함 라우트 id → GET /links 필터. 숫자 id 는 사용자 폴더(folderId)로 취급한다.
 *
 * 정렬 기준은 폴더가 정한다 — 최근 삭제 목록은 저장 시각이 아니라 삭제 시각 순이고,
 * 서버도 `deleted=false` 와 `sortBy=deletedAt` 조합은 400 으로 막는다.
 */
export function toLinkListParams(
  folderId: string,
  sort: LinkSortOption = "latest",
): LinkListParams {
  const order = sort === "latest" ? "desc" : "asc";

  switch (folderId) {
    case "all":
      return { sortBy: "savedAt", order };
    case "uncategorized":
      return { unassigned: true, sortBy: "savedAt", order };
    case "favorites":
      return { favorite: true, sortBy: "savedAt", order };
    case "trash":
      return { deleted: true, sortBy: "deletedAt", order };
    default:
      return { folderId: Number(folderId), sortBy: "savedAt", order };
  }
}

export const folderLinkQueries = {
  // 보관함은 라우트 id·정렬만 알고, 목록 조회 자체는 링크 목록 쿼리가 소유한다.
  // 정렬은 params 에 녹아 쿼리 키에 포함된다 — 최신순 캐시가 오래된 순 화면에 재사용되지 않는다.
  list: (folderId: string, sort: LinkSortOption = "latest") =>
    linkQueries.list(toLinkListParams(folderId, sort)),
};
