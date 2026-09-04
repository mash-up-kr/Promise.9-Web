import { FOLDER_COLOR_OPTIONS } from "@shared/folder/folder.constants";

import { FOLDER_SOLID_CLASS } from "./archive.constants";

describe("FOLDER_SOLID_CLASS", () => {
  test("모든 색상에 대응하는 NativeWind 클래스가 있다", () => {
    for (const color of FOLDER_COLOR_OPTIONS) {
      expect(FOLDER_SOLID_CLASS[color]).toBe(`bg-folder-${color}-solid`);
    }
  });
});
