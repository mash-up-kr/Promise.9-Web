/** 사용자 폴더 — 서버 GET /folders(FolderListItemDto) 기반. 식별자·필드명은 서버를 따른다. */
export interface Folder {
  folderId: number;
  folderName: string;
  linkCount: number;
  lastSavedAt: string | null;
}
