import type { FolderColor } from "@shared/types/link.types";

/**
 * 폴더 색상 tone(UI 디자인 토큰 이름) → hex(서버 저장·전송 값) 매핑.
 *
 * hex 는 앱/웹 `global.css` 의 `--color-folder-*-solid` 값이자 서버 폴더 색상 팔레트(FOLDER_COLORS)와
 * 소문자 기준 1:1 로 일치한다. `gray` 는 시스템 폴더 전용 tone 이라 서버 팔레트에 대응 hex 가 없어 제외한다.
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
} as const satisfies Partial<Record<FolderColor, string>>;

export type MappedFolderTone = keyof typeof FOLDER_TONE_HEX;

const HEX_TO_TONE: ReadonlyMap<string, MappedFolderTone> = new Map(
  Object.entries(FOLDER_TONE_HEX).map(([tone, hex]) => [
    hex,
    tone as MappedFolderTone,
  ]),
);

/** UI tone → 서버 저장용 hex. */
export function folderToneToHex(tone: MappedFolderTone): string {
  return FOLDER_TONE_HEX[tone];
}

/** 서버 hex → UI tone. 팔레트에 없거나 기본색(#000000)이면 `gray` 로 폴백. */
export function hexToFolderTone(hex: string): FolderColor {
  return HEX_TO_TONE.get(hex.toLowerCase()) ?? "gray";
}
