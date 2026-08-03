import type { FolderColor } from "@shared/types/link.types";

import type { SYSTEM_FOLDERS } from "./archive.constants";

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

/** 기본 폴더 카운트 키 — GET /folders `systemFolders` 응답 키와 1:1. */
export type SystemFolderKey = (typeof SYSTEM_FOLDERS)[number]["countKey"];

/**
 * 보관함 목록 화면 데이터.
 *
 * 기본 폴더는 이름·순서가 고정(SYSTEM_FOLDERS)이라 서버에서 오는 건 링크 수뿐이다.
 * 그래서 폴더 항목이 아니라 카운트만 담아, 화면이 목록을 먼저 그리고 수치만 나중에 채우게 한다.
 */
export interface ArchiveFolderData {
  systemFolderCounts: Record<SystemFolderKey, number>;
  myFolders: ArchiveFolder[];
}
