import { FOLDER_TONE_HEX } from "@shared/folder/folder.constants";

import { FOLDER_COLOR_OPTIONS, FOLDER_SOLID_CLASS } from "./archive.constants";

describe("FOLDER_COLOR_OPTIONS", () => {
  // 그리드 순서(Figma 2행 × 6열)는 팔레트 순서와 달라 튜플로 따로 두지만, 집합은 같아야 한다.
  // satisfies 는 색 누락을 잡지 못하므로 여기서 강제한다.
  test("서버 팔레트 12색을 빠짐없이 포함한다", () => {
    expect(new Set(FOLDER_COLOR_OPTIONS)).toEqual(
      new Set(Object.keys(FOLDER_TONE_HEX)),
    );
  });

  test("모든 색상에 대응하는 NativeWind 클래스가 있다", () => {
    for (const color of FOLDER_COLOR_OPTIONS) {
      expect(FOLDER_SOLID_CLASS[color]).toBe(`bg-folder-${color}-solid`);
    }
  });
});
