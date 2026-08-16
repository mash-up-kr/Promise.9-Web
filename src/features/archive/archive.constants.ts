import type { SelectableFolderColor } from "@shared/folder/folder.constants";

/**
 * 시스템(기본) 폴더 descriptor.
 * - `id`: 라우팅·상세 조회 필터 식별자 (실제 folders row 가 아님)
 * - `name`: 표시명
 * - `countKey`: GET /folders `systemFolders` 응답에서 링크 수를 읽을 키
 */
/** 미분류 — 폴더 이동 시트가 유일하게 고를 수 있는 기본 폴더라 따로 꺼내 쓴다. */
export const UNCATEGORIZED_FOLDER = {
  id: "uncategorized",
  name: "미분류",
  countKey: "uncategorized",
} as const;

export const SYSTEM_FOLDERS = [
  { id: "all", name: "전체", countKey: "all" },
  UNCATEGORIZED_FOLDER,
  { id: "favorites", name: "즐겨찾기", countKey: "favorite" },
  { id: "trash", name: "최근 삭제된 링크", countKey: "recentlyDeleted" },
] as const;

// Figma 폴더 상세 "정렬" 서브메뉴 — 순서·표시명이 곧 메뉴 항목이다. 기본값은 첫 항목(최신순).
export const LINK_SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된 순" },
] as const;

// Figma "새 폴더 만들기" 시트 색상 그리드 순서 (2행 × 6열).
export const FOLDER_COLOR_OPTIONS = [
  "slate",
  "purple",
  "blue",
  "teal",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "orange-red",
  "lime",
  "yellow-green",
] as const satisfies readonly SelectableFolderColor[];

// NativeWind 는 동적 클래스(`bg-folder-${color}-solid`)를 스캔하지 못하므로 리터럴로 나열한다.
export const FOLDER_SOLID_CLASS: Record<SelectableFolderColor, string> = {
  slate: "bg-folder-slate-solid",
  purple: "bg-folder-purple-solid",
  blue: "bg-folder-blue-solid",
  teal: "bg-folder-teal-solid",
  green: "bg-folder-green-solid",
  yellow: "bg-folder-yellow-solid",
  orange: "bg-folder-orange-solid",
  red: "bg-folder-red-solid",
  pink: "bg-folder-pink-solid",
  "orange-red": "bg-folder-orange-red-solid",
  lime: "bg-folder-lime-solid",
  "yellow-green": "bg-folder-yellow-green-solid",
};
