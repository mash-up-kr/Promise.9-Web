import type { FolderColor } from "@shared/types/link.types";

/**
 * 보관함 폴더 목록 항목 (UI 전용).
 *
 * 서버 폴더 row(GET /folders)뿐 아니라 전체·미분류·즐겨찾기·최근 삭제 같은 시스템 항목까지
 * 한 목록으로 표시하므로 문자열 id·표시색(tone)을 갖는다. 서버 사용자 폴더 DTO 는 `@shared/types/folder.types`.
 */
export interface ArchiveFolder {
  id: string;
  name: string;
  count: number;
  tone: FolderColor;
}
