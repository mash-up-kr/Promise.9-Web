import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ArchiveMoreMenu } from "./ArchiveMoreMenu";

const renderMenu = (props?: Partial<Parameters<typeof ArchiveMoreMenu>[0]>) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ArchiveMoreMenu
        onCreateFolder={jest.fn()}
        onEditOrder={jest.fn()}
        {...props}
      />
    </SafeAreaProvider>,
  );

describe("ArchiveMoreMenu", () => {
  test("처음에는 메뉴가 닫혀 있다", async () => {
    await renderMenu();
    expect(screen.queryByText("새 폴더 만들기")).toBeNull();
  });

  test("더보기를 누르면 메뉴 항목이 나타난다", async () => {
    await renderMenu();
    await fireEvent.press(screen.getByLabelText("더보기"));
    expect(screen.getByText("새 폴더 만들기")).toBeOnTheScreen();
    expect(screen.getByText("폴더 정렬 편집")).toBeOnTheScreen();
  });

  test("새 폴더 만들기를 누르면 onCreateFolder 를 호출한다", async () => {
    const onCreateFolder = jest.fn();
    await renderMenu({ onCreateFolder });
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("새 폴더 만들기"));
    expect(onCreateFolder).toHaveBeenCalledTimes(1);
  });

  test("폴더 정렬 편집을 누르면 onEditOrder 를 호출한다", async () => {
    const onEditOrder = jest.fn();
    await renderMenu({ onEditOrder });
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));
    expect(onEditOrder).toHaveBeenCalledTimes(1);
  });
});
