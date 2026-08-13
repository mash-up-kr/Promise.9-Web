import { fireEvent, render, screen } from "@testing-library/react-native";
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

  test("탭하면 메뉴 대신 폴더를 연다", async () => {
    const onOpenFolder = jest.fn();
    await renderMenu({ onOpenFolder });
    await fireEvent.press(screen.getByText("디자인"));

    expect(onOpenFolder).toHaveBeenCalled();
    expect(screen.queryByText("폴더 편집")).toBeNull();
  });
});
