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
/**
 * 링크가 하나도 없을 때 보여줄 문구 (Figma "보관함 - empty" 46:5662).
 *
 * 기본 폴더마다 안내가 다르다. 사용자 폴더는 시안이 없어 `all` 문구로 폴백한다
 * (resolveEmptyLinksMessage).
 */
export const EMPTY_LINKS_MESSAGES = {
  all: {
    title: "아직 저장된 링크가 없어요",
    description: "링크를 저장하고 한곳에서 모아보세요",
  },
  uncategorized: {
    title: "분류되지 않은 링크가 없어요",
    description: "폴더를 선택하지 않으면 미분류로 저장돼요",
  },
  favorites: {
    title: "즐겨찾기한 링크가 없어요",
    description: "자주 보고 싶은 링크를 즐겨찾기 해보세요",
  },
  trash: {
    title: "삭제된 링크가 없어요",
    description: "삭제된 링크는 30일 동안 보관돼요",
  },
} as const;

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
