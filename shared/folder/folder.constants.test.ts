import type { FolderColor } from "@shared/types/link.types";

import {
  FOLDER_COLOR_OPTIONS,
  FOLDER_TONE_HEX,
  folderToneToHex,
  hexToFolderTone,
} from "./folder.constants";

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

describe("FOLDER_COLOR_OPTIONS", () => {
  // 그리드 순서(Figma 2행 × 6열)는 팔레트 선언 순서와 달라 튜플로 따로 두지만, 집합은 같아야 한다.
  // satisfies 는 색 누락을 잡지 못하므로 여기서 강제한다.
  test("서버 팔레트 12색을 빠짐없이 포함한다", () => {
    expect(new Set(FOLDER_COLOR_OPTIONS)).toEqual(
      new Set(Object.keys(FOLDER_TONE_HEX)),
    );
  });

  // 순서 자체가 시안이다 — 집합 검사만으로는 시안이 재배열돼도 드러나지 않는다.
  // 앞 6개가 1행(난색), 뒤 6개가 2행(한색)이고 첫 항목이 곧 생성 폼의 기본 선택색이다.
  test("Figma 그리드 순서(난색 행 → 한색 행)를 그대로 따른다", () => {
    expect(FOLDER_COLOR_OPTIONS).toEqual([
      "yellow-green",
      "yellow",
      "orange",
      "orange-red",
      "red",
      "pink",
      "lime",
      "green",
      "teal",
      "blue",
      "slate",
      "purple",
    ]);
  });
});
