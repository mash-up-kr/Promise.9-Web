import type { FolderColor } from "@shared/types/link.types";

/** 폴더 생성 시 사용자가 고를 수 있는 색상. gray 는 시스템 폴더 전용이라 제외한다. */
export type SelectableFolderColor = Exclude<FolderColor, "gray">;

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
