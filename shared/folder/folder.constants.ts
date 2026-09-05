import type { FolderColor } from "@shared/types/link.types";

/** 사용자가 폴더에 고를 수 있는 색. gray 는 시스템 폴더 전용이라 제외한다. */
export type SelectableFolderColor = Exclude<FolderColor, "gray">;

/**
 * 폴더 색상 tone(UI 디자인 토큰 이름) → hex(서버 저장·전송 값) 매핑.
 *
 * hex 는 앱/웹 `global.css` 의 `--color-folder-*-solid` 값이자 서버 폴더 색상 팔레트(FOLDER_COLORS)와
 * 소문자 기준 1:1 로 일치한다. `Record<SelectableFolderColor, string>` 이라 색이 빠지면 컴파일 에러가 난다
 * (`gray` 는 서버 팔레트에 대응 hex 가 없어 애초에 제외된다).
 */
export const FOLDER_TONE_HEX = {
  blue: "#61a8ef",
  slate: "#859fc1",
  purple: "#b282cc",
  "orange-red": "#ec5a29",
  green: "#50b094",
  teal: "#81c7ba",
  pink: "#ee97a4",
  red: "#e34647",
  lime: "#8bd35f",
  "yellow-green": "#d5d76a",
  yellow: "#f8d457",
  orange: "#f1a23f",
} as const satisfies Record<SelectableFolderColor, string>;

const HEX_TO_TONE: ReadonlyMap<string, SelectableFolderColor> = new Map(
  Object.entries(FOLDER_TONE_HEX).map(([tone, hex]) => [
    hex,
    tone as SelectableFolderColor,
  ]),
);

/** UI tone → 서버 저장용 hex. */
export function folderToneToHex(tone: SelectableFolderColor): string {
  return FOLDER_TONE_HEX[tone];
}

/** 서버 hex → UI tone. 팔레트에 없거나 기본색(#000000)이면 `gray` 로 폴백. */
export function hexToFolderTone(hex: string): FolderColor {
  return HEX_TO_TONE.get(hex.toLowerCase()) ?? "gray";
}

/**
 * 폴더 색 팔레트의 노출 순서 — Figma "새 폴더 만들기" 색상 그리드(2행 × 6열).
 *
 * 앱·웹과 익스텐션이 같은 시안의 같은 그리드를 그리므로 순서도 한 곳에서 정한다.
 * 표면별 렌더 방식(NativeWind 클래스 / inline hex)은 각자 정한다.
 */
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
