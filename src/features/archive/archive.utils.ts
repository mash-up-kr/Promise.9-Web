import type { ArchiveFolder } from "./archive.types";

/**
 * 서버 폴더 목록에 로컬 정렬 순서를 적용한다.
 *
 * 재정렬 저장 API 가 아직 없어 순서는 로컬 전용이다. 서버 배열을 통째로 복사해두면
 * 재조회(폴더 생성 후 invalidate 등) 때 사용자가 바꾼 순서가 덮어써지므로, id 순서만
 * 들고 있다가 매 렌더에서 최신 서버 데이터에 적용한다.
 *
 * @param orderedIds 로컬 순서. 비어 있으면 서버 순서를 그대로 쓴다.
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
