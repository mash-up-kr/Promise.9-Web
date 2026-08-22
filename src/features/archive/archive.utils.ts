import { hexToFolderTone } from "@shared/folder/folder.constants";

import type { FolderListResponse } from "@/entities/folder/folder.queries";

import type {
  ArchiveFolder,
  ArchiveFolderData,
  SystemFolderKey,
} from "./archive.types";

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
