import type { FolderListResponse } from "@shared/entities/folder/folder.queries";
import type { LinkListParams } from "@shared/entities/link/link.queries";
import { hexToFolderTone } from "@shared/folder/folder.constants";

import { EMPTY_LINKS_MESSAGES, SYSTEM_FOLDERS } from "./archive.constants";
import type {
  ArchiveFolder,
  ArchiveFolderData,
  LinkSortOption,
  SystemFolderKey,
} from "./archive.types";

export interface EmptyLinksMessage {
  title: string;
  description: string;
}

/** 보관함 라우트 id → 빈 상태 문구. 시안이 없는 사용자 폴더는 전체 폴더 문구를 쓴다. */
export function resolveEmptyLinksMessage(folderId: string): EmptyLinksMessage {
  return (
    EMPTY_LINKS_MESSAGES[folderId as keyof typeof EMPTY_LINKS_MESSAGES] ??
    EMPTY_LINKS_MESSAGES.all
  );
}

/**
 * 서버 폴더 목록에 편집 중인 정렬 순서를 적용한다.
 *
 * 서버 배열을 통째로 복사해두면 재조회(폴더 생성 후 invalidate 등) 때 사용자가 드래그한
 * 순서가 덮어써지므로, id 순서만 들고 있다가 매 렌더에서 최신 서버 데이터에 적용한다.
 * 순서를 저장(PUT /folders/order)하고 나면 서버 순서가 정답이므로 호출부가 이 목록을 비운다.
 *
 * @param orderedIds 편집 중 순서. 비어 있으면 서버 순서를 그대로 쓴다.
 */
export function applyFolderOrder(
  folders: ArchiveFolder[],
  orderedIds: readonly string[],
): ArchiveFolder[] {
  if (orderedIds.length === 0) {
    return folders;
  }

  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  const ordered: ArchiveFolder[] = [];
  // 로컬 순서에 없는 폴더(재정렬 후 새로 생성)는 서버 순서를 유지한 채 뒤에 붙인다.
  const appended: ArchiveFolder[] = [];

  for (const folder of folders) {
    if (rank.has(folder.id)) {
      ordered.push(folder);
    } else {
      appended.push(folder);
    }
  }
  ordered.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

  return [...ordered, ...appended];
}

/** GET /folders 응답을 보관함 UI 모델로 변환한다. 목록 쿼리의 `select` 로 쓴다. */
export function toArchiveFolderData(
  res: FolderListResponse,
): ArchiveFolderData {
  // 기본 폴더의 표시명·순서는 SYSTEM_FOLDERS 가 갖고 있으므로 링크 수만 뽑는다.
  const systemFolderCounts: Record<SystemFolderKey, number> = {
    all: res.systemFolders.all.linkCount,
    uncategorized: res.systemFolders.uncategorized.linkCount,
    favorite: res.systemFolders.favorite.linkCount,
    recentlyDeleted: res.systemFolders.recentlyDeleted.linkCount,
  };

  const myFolders: ArchiveFolder[] = res.folders.map((folder) => ({
    id: String(folder.folderId),
    name: folder.folderName,
    count: folder.linkCount,
    tone: hexToFolderTone(folder.color),
  }));

  return { systemFolderCounts, myFolders };
}

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
 * 정렬이 params 에 녹아 쿼리 키에 포함되므로 최신순 캐시가 오래된 순 화면에 재사용되지 않는다.
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
