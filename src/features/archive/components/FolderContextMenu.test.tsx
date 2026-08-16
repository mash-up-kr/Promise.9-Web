// 트리거 방식이 플랫폼마다 다르다(웹=hover 후 "..." 클릭 · 모바일=롱프레스).
// jest 는 항상 네이티브로 도는 환경이라 플랫폼 판별을 갈아끼워 양쪽을 다 검증한다.
const mockPlatform = { isWeb: false };
jest.mock("@/constants/platform.constants", () => ({
  get isWeb() {
    return mockPlatform.isWeb;
  },
  get isIOS() {
    return !mockPlatform.isWeb;
  },
  isAndroid: false,
  isServer: false,
}));

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
  beforeEach(() => {
    mockPlatform.isWeb = false;
  });

  test("기본은 폴더 행만 보이고 메뉴는 닫혀 있다", async () => {
    await renderMenu();

    expect(screen.getByText("디자인")).toBeOnTheScreen();
    expect(screen.queryByText("폴더 편집")).toBeNull();
  });

  test("길게 누르면 편집·삭제 메뉴가 열린다", async () => {
    await renderMenu();
    await fireEvent(screen.getByLabelText("디자인"), "longPress");

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
    await fireEvent(screen.getByLabelText("디자인"), "longPress");
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText(label));

    expect(handler).not.toHaveBeenCalled();
    await act(async () => dismiss());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("탭하면 메뉴 대신 폴더를 연다", async () => {
    const onOpenFolder = jest.fn();
    await renderMenu({ onOpenFolder });
    await fireEvent.press(screen.getByLabelText("디자인"));

    expect(onOpenFolder).toHaveBeenCalled();
    expect(screen.queryByText("폴더 편집")).toBeNull();
  });
});

// 웹: 폴더 항목 hover 시 "..." 버튼 노출 → 클릭하면 메뉴 표시 (Figma archive / context-menu).
describe("FolderContextMenu (웹)", () => {
  beforeEach(() => {
    mockPlatform.isWeb = true;
  });

  test("hover 하기 전에는 더보기 버튼이 없다", async () => {
    await renderMenu();

    expect(screen.queryByLabelText("폴더 메뉴 열기")).toBeNull();
  });

  test("hover 후 더보기 버튼을 누르면 메뉴가 열린다", async () => {
    await renderMenu();
    await fireEvent(screen.getByText("디자인"), "pointerEnter");
    await fireEvent.press(screen.getByLabelText("폴더 메뉴 열기"));

    expect(screen.getByText("폴더 편집")).toBeOnTheScreen();
    expect(screen.getByText("삭제")).toBeOnTheScreen();
  });

  test("길게 눌러도 메뉴가 열리지 않는다", async () => {
    await renderMenu();
    await fireEvent(screen.getByLabelText("디자인"), "longPress");

    expect(screen.queryByText("폴더 편집")).toBeNull();
  });
});
