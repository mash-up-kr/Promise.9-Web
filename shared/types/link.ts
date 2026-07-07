/**
 * 저장된 링크 도메인 타입 (link-detail 화면 기준).
 *
 * 백엔드 API 스펙이 아직 확정되지 않아 필드가 변경될 수 있다.
 * 필드 추가/삭제 시 이 타입 하나만 수정하면 되도록 의도적으로 단일 flat 구조로 유지한다.
 */

/**
 * 폴더 색상 — 디자인 시스템 folder 토큰(global.css `--color-folder-*`)의 variant 이름.
 * 백엔드가 폴더별 색을 내려주기 전까지는 mock 에서만 채운다(임시).
 */
export type FolderColor =
  | "gray"
  | "blue"
  | "slate"
  | "purple"
  | "orange-red"
  | "green"
  | "teal"
  | "pink"
  | "red"
  | "lime"
  | "yellow-green"
  | "yellow"
  | "orange";

export type Link = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  /** ISO 8601 문자열 */
  savedAt: string;
  folder?: string;
  /** 폴더 배지 색. 백엔드 스펙 확정 전까지 임시(mock). `folder` 없으면 무시(미분류). */
  folderColor?: FolderColor;
  tags: string[];
  memo: string;
  aiSummary: string;
  isFavorite: boolean;
  /** 썸네일 대표색 — 백엔드가 내려주는 헥스 문자열 (#RRGGBB). 동적 배경에 사용. */
  dominantColor?: string;
};
