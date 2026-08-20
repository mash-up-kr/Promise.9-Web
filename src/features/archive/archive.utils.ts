import { EMPTY_LINKS_MESSAGES } from "./archive.constants";
import type { ArchiveFolder } from "./archive.types";

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
