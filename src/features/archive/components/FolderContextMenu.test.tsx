import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import type { ArchiveFolder } from "../archive.types";
import { FolderContextMenu } from "./FolderContextMenu";

const folder: ArchiveFolder = {
  id: "1",
  name: "디자인",
  count: 5,
  tone: "blue",
};

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderMenu = (
  props?: Partial<React.ComponentProps<typeof FolderContextMenu>>,
) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <FolderContextMenu
        folder={folder}
        onOpenFolder={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        {...props}
      />
    </SafeAreaProvider>,
  );

// 팝오버는 iOS(테스트 환경 Platform.OS)에서 Modal 이 사라진 뒤에야 고른 동작을 실행한다.
// RNTL 은 네이티브 dismiss 를 흉내내지 않고 닫힌 Modal 은 트리에서 사라지므로,
// 누르기 전에 onDismiss 를 붙잡아 두었다가 직접 호출한다.
const captureDismiss = (): (() => void) =>
  screen.getByTestId("popover-overlay").props.onDismiss;

describe("FolderContextMenu", () => {
  test("기본은 폴더 행만 보이고 메뉴는 닫혀 있다", async () => {
    await renderMenu();

    expect(screen.getByText("디자인")).toBeOnTheScreen();
    expect(screen.queryByText("폴더 편집")).toBeNull();
  });

  test("길게 누르면 편집·삭제 메뉴가 열린다", async () => {
    await renderMenu();
    await fireEvent(screen.getByText("디자인"), "longPress");

    expect(screen.getByText("폴더 편집")).toBeOnTheScreen();
    expect(screen.getByText("삭제")).toBeOnTheScreen();
  });

  // iOS 는 메뉴 Modal 이 사라지는 도중에 다른 Modal 을 띄우면 그게 나타나지 않는다.
  test.each([
    ["폴더 편집", "onEdit"],
    ["삭제", "onDelete"],
  ] as const)("%s 는 메뉴가 닫힌 뒤에 실행한다", async (label, prop) => {
    const handler = jest.fn();
    await renderMenu({ [prop]: handler });
    await fireEvent(screen.getByText("디자인"), "longPress");
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText(label));

    expect(handler).not.toHaveBeenCalled();
    await act(async () => dismiss());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("탭하면 메뉴 대신 폴더를 연다", async () => {
    const onOpenFolder = jest.fn();
    await renderMenu({ onOpenFolder });
    await fireEvent.press(screen.getByText("디자인"));

    expect(onOpenFolder).toHaveBeenCalled();
    expect(screen.queryByText("폴더 편집")).toBeNull();
  });
});
