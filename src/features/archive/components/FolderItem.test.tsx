import { fireEvent, render, screen } from "@testing-library/react-native";

import { FolderItem, folderToneFill } from "./FolderItem";

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

describe("FolderItem", () => {
  test("이름과 개수를 렌더한다", async () => {
    await render(<FolderItem name="전체" count={370} tone="gray" />);
    expect(screen.getByText("전체")).toBeOnTheScreen();
    expect(screen.getByText("370")).toBeOnTheScreen();
  });

  test("누르면 onPress 가 호출된다", async () => {
    const onPress = jest.fn();
    await render(
      <FolderItem name="AI" count={12} tone="blue" onPress={onPress} />,
    );
    fireEvent.press(screen.getByLabelText("AI"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// 웹 전용 트리거 — 시안(archive / context-menu)은 hover 때만 "..." 를 노출한다.
describe("FolderItem 더보기 버튼", () => {
  const MORE_LABEL = "폴더 메뉴 열기";

  test("onMorePress 가 없으면 hover 해도 버튼이 없다", async () => {
    await render(<FolderItem name="AI" count={12} tone="blue" />);
    await fireEvent(screen.getByText("AI"), "pointerEnter");

    expect(screen.queryByLabelText(MORE_LABEL)).toBeNull();
  });

  test("onMorePress 가 있으면 hover 하는 동안만 버튼이 보인다", async () => {
    await render(
      <FolderItem name="AI" count={12} tone="blue" onMorePress={jest.fn()} />,
    );
    expect(screen.queryByLabelText(MORE_LABEL)).toBeNull();

    await fireEvent(screen.getByText("AI"), "pointerEnter");
    expect(screen.getByLabelText(MORE_LABEL)).toBeOnTheScreen();

    await fireEvent(screen.getByText("AI"), "pointerLeave");
    expect(screen.queryByLabelText(MORE_LABEL)).toBeNull();
  });

  // 버튼과 행 히트 영역이 겹치면 메뉴를 여는 동시에 폴더가 열린다.
  test("버튼을 누르면 onMorePress 만 호출되고 행은 열리지 않는다", async () => {
    const onPress = jest.fn();
    const onMorePress = jest.fn();
    await render(
      <FolderItem
        name="AI"
        count={12}
        tone="blue"
        onPress={onPress}
        onMorePress={onMorePress}
      />,
    );
    await fireEvent(screen.getByText("AI"), "pointerEnter");
    await fireEvent.press(screen.getByLabelText(MORE_LABEL));

    expect(onMorePress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
