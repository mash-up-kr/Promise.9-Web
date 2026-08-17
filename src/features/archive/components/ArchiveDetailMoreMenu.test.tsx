import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ArchiveDetailMoreMenu } from "./ArchiveDetailMoreMenu";

const renderMenu = (
  props?: Partial<Parameters<typeof ArchiveDetailMoreMenu>[0]>,
) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ArchiveDetailMoreMenu
        sort="latest"
        onSortChange={jest.fn()}
        onSelectMode={jest.fn()}
        {...props}
      />
    </SafeAreaProvider>,
  );

const openMenu = () => fireEvent.press(screen.getByLabelText("더보기"));

describe("ArchiveDetailMoreMenu", () => {
  test("처음에는 메뉴가 닫혀 있다", async () => {
    await renderMenu();
    expect(screen.queryByText("선택하기")).toBeNull();
  });

  test("더보기를 누르면 선택하기·정렬이 나타난다", async () => {
    await renderMenu();
    await openMenu();
    expect(screen.getByText("선택하기")).toBeOnTheScreen();
    expect(screen.getByText("정렬")).toBeOnTheScreen();
  });

  test("정렬을 펼치기 전에는 정렬 기준이 보이지 않는다", async () => {
    await renderMenu();
    await openMenu();
    expect(screen.queryByText("최신순")).toBeNull();
  });

  test("정렬을 누르면 최신순·오래된 순이 펼쳐진다", async () => {
    await renderMenu();
    await openMenu();
    await fireEvent.press(screen.getByText("정렬"));
    expect(screen.getByText("최신순")).toBeOnTheScreen();
    expect(screen.getByText("오래된 순")).toBeOnTheScreen();
  });

  // 서브메뉴가 열린 동안 부모 행은 눌린 상태로 남는다(Figma gray-600).
  test("정렬을 펼치면 정렬 행이 눌린 상태로 보인다", async () => {
    await renderMenu();
    await openMenu();
    expect(screen.getByLabelText("정렬").props.className).not.toContain(
      "bg-gray-600",
    );

    await fireEvent.press(screen.getByText("정렬"));

    expect(screen.getByLabelText("정렬").props.className).toContain(
      "bg-gray-600",
    );
  });

  test("현재 정렬 기준을 선택된 상태로 표시한다", async () => {
    await renderMenu({ sort: "oldest" });
    await openMenu();
    await fireEvent.press(screen.getByText("정렬"));

    expect(screen.getByLabelText("오래된 순")).toBeSelected();
    expect(screen.getByLabelText("최신순")).not.toBeSelected();
  });

  test("정렬 기준을 고르면 onSortChange 를 호출한다", async () => {
    const onSortChange = jest.fn();
    await renderMenu({ onSortChange });
    await openMenu();
    await fireEvent.press(screen.getByText("정렬"));
    await fireEvent.press(screen.getByText("오래된 순"));

    expect(onSortChange).toHaveBeenCalledWith("oldest");
  });

  test("선택하기를 누르면 onSelectMode 를 호출한다", async () => {
    const onSelectMode = jest.fn();
    await renderMenu({ onSelectMode });
    await openMenu();
    await fireEvent.press(screen.getByText("선택하기"));

    expect(onSelectMode).toHaveBeenCalledTimes(1);
  });

  // 최근 삭제 폴더는 고를 수 있는 동작이 복구뿐이라 "선택하기" 자리가 "복구하기"가 된다.
  describe("최근 삭제 폴더", () => {
    test("선택하기 대신 복구하기를 보여준다", async () => {
      await renderMenu({ variant: "trash" });
      await openMenu();

      expect(screen.getByText("복구하기")).toBeOnTheScreen();
      expect(screen.queryByText("선택하기")).toBeNull();
      expect(screen.getByText("정렬")).toBeOnTheScreen();
    });

    test("복구하기를 누르면 onSelectMode 를 호출한다", async () => {
      const onSelectMode = jest.fn();
      await renderMenu({ variant: "trash", onSelectMode });
      await openMenu();
      await fireEvent.press(screen.getByText("복구하기"));

      expect(onSelectMode).toHaveBeenCalledTimes(1);
    });
  });

  // 메뉴를 닫았다 다시 열면 정렬 서브메뉴는 접힌 처음 상태여야 한다.
  test("메뉴를 다시 열면 정렬 서브메뉴가 접혀 있다", async () => {
    await renderMenu();
    await openMenu();
    await fireEvent.press(screen.getByText("정렬"));
    await fireEvent.press(screen.getByLabelText("메뉴 닫기"));
    await openMenu();

    expect(screen.queryByText("최신순")).toBeNull();
  });
});
