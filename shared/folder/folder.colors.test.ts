import type { FolderColor } from "@shared/types/link.types";

import {
  FOLDER_TONE_HEX,
  folderToneToHex,
  hexToFolderTone,
} from "./folder.colors";

describe("folder color mapping", () => {
  const tones = Object.keys(
    FOLDER_TONE_HEX,
  ) as (keyof typeof FOLDER_TONE_HEX)[];

  it("모든 매핑 tone 이 hex↔tone 왕복에서 보존된다", () => {
    for (const tone of tones) {
      expect(hexToFolderTone(folderToneToHex(tone))).toBe(tone);
    }
  });

  it("서버 hex 를 UI tone 으로 변환한다", () => {
    expect(hexToFolderTone("#61a8ef")).toBe<FolderColor>("blue");
    expect(hexToFolderTone("#f1a23f")).toBe<FolderColor>("orange");
  });

  it("대문자 hex 도 소문자 팔레트에 매칭한다", () => {
    expect(hexToFolderTone("#61A8EF")).toBe<FolderColor>("blue");
  });

  it("기본색(#000000)·팔레트 밖 값은 gray 로 폴백한다", () => {
    expect(hexToFolderTone("#000000")).toBe<FolderColor>("gray");
    expect(hexToFolderTone("#123456")).toBe<FolderColor>("gray");
  });
});
