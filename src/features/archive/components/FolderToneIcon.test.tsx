import { render } from "@testing-library/react-native";

import {
  FolderToneIcon,
  folderToneFill,
  folderToneSlotClass,
} from "./FolderToneIcon";

describe("folderToneFill", () => {
  test("각 tone 을 해당 폴더 색 hex 로 매핑한다", () => {
    expect(folderToneFill("blue")).toBe("#61a8ef");
    expect(folderToneFill("orange")).toBe("#f1a23f");
    expect(folderToneFill("purple")).toBe("#b282cc");
  });

  test("gray 는 목록 전용 회색을 쓴다", () => {
    expect(folderToneFill("gray")).toBe("#65656b");
  });
});

describe("folderToneSlotClass", () => {
  test("각 tone 을 자기 subtle 배경 토큰으로 매핑한다", () => {
    expect(folderToneSlotClass("purple")).toBe("bg-folder-purple-subtle");
    expect(folderToneSlotClass("yellow-green")).toBe(
      "bg-folder-yellow-green-subtle",
    );
  });

  test("gray(시스템 폴더)도 자기 subtle 토큰을 쓴다", () => {
    expect(folderToneSlotClass("gray")).toBe("bg-folder-gray-subtle");
  });
});

describe("FolderToneIcon", () => {
  test("tone 슬롯 배경 위에 같은 tone 의 폴더 아이콘을 그린다", async () => {
    const view = await render(<FolderToneIcon tone="red" />);
    const tree = JSON.stringify(view.toJSON());

    expect(tree).toContain("bg-folder-red-subtle");
    // react-native-svg 는 fill hex 를 ARGB 정수로 직렬화한다. red-solid(#e34647).
    expect(tree).toContain(String(0xffe34647));
  });
});
