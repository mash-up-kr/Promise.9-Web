import type { FolderColor } from "./link";

/**
 * 보관함 폴더 도메인 타입 (폴더 목록 화면 기준).
 *
 * 폴더 API 가 아직 없어 현재는 mock 정적 데이터로만 채운다(임시).
 */
export type Folder = {
  id: string;
  name: string;
  count: number;
  /** 폴더 아이콘 색. 기본 폴더는 gray, 사용자 폴더는 blue. */
  tone: FolderColor;
};
