/**
 * 사용자 폴더 — 서버 docs/api/folder.md GET /folders 응답 기반.
 * 식별자·이름은 id·name 으로 통일한다 (서버는 folderId·folderName).
 */
export interface Folder {
  id: number;
  name: string;
  linkCount: number;
  lastSavedAt: string;
}
