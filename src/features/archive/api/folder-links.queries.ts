import { type LinkListParams, linkQueries } from "@/entities/link/link.queries";

import { SYSTEM_FOLDERS } from "../archive.constants";

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

/** 보관함 라우트 id → GET /links 필터. 숫자 id 는 사용자 폴더(folderId)로 취급한다. */
export function toLinkListParams(folderId: string): LinkListParams {
  switch (folderId) {
    case "all":
      return {};
    case "uncategorized":
      return { unassigned: true };
    case "favorites":
      return { favorite: true };
    case "trash":
      return { deleted: true };
    default:
      return { folderId: Number(folderId) };
  }
}

export const folderLinkQueries = {
  // 보관함은 라우트 id 만 알고, 목록 조회 자체는 링크 목록 쿼리가 소유한다.
  list: (folderId: string) => linkQueries.list(toLinkListParams(folderId)),
};
