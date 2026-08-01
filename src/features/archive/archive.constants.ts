import type { SelectableFolderColor } from "@shared/folder/folder.constants";

/**
 * 시스템(기본) 폴더 descriptor.
 * - `id`: 라우팅·상세 조회 필터 식별자 (실제 folders row 가 아님)
 * - `name`: 표시명
 * - `countKey`: GET /folders `systemFolders` 응답에서 링크 수를 읽을 키
 */
export const SYSTEM_FOLDERS = [
  { id: "all", name: "전체", countKey: "all" },
  { id: "uncategorized", name: "미분류", countKey: "uncategorized" },
  { id: "favorites", name: "즐겨찾기", countKey: "favorite" },
  { id: "trash", name: "최근 삭제된 링크", countKey: "recentlyDeleted" },
] as const;

/**
 * 서버 폴더 도메인 errorCode — 서버 `docs/policy/error-code.md` 기준.
 * 409 는 "중복 생성 또는 리소스 상태 충돌" 을 모두 포함하므로 상태 코드 대신 이 값으로 구분한다.
 */
export const FOLDER_ERROR_CODE = {
  DUPLICATE_NAME: 920002,
} as const;

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
