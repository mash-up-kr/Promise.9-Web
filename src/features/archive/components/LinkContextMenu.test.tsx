import type { Link } from "@shared/types/link.types";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { LinkContextMenu, type LinkContextMenuProps } from "./LinkContextMenu";

const link: Link = {
  linkId: 42,
  title: "피그마 파일 PSD로 변환하는 방법",
  source: "example.com",
  thumbnailUrl: null,
  savedAt: "2026-07-26T00:00:00.000Z",
  representativeTag: null,
};

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// 기본 폴더용 props 위에 필요한 것만 덮어쓴다. variant 마다 핸들러가 달라 union 이므로,
// 합쳐진 결과를 컴포넌트 props 로 단언한다(테스트가 넘기는 조합은 아래에서 직접 고른다).
const renderMenu = (props?: Record<string, unknown>) => {
  const merged = {
    link,
    onOpenLink: () => {},
    onMove: () => {},
    onShare: () => {},
    onDelete: () => {},
    ...props,
  } as LinkContextMenuProps;

  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <LinkContextMenu {...merged} />
    </SafeAreaProvider>,
  );
};

// 팝오버는 iOS(테스트 환경 Platform.OS)에서 Modal 이 사라진 뒤에야 고른 동작을 실행한다.
// RNTL 은 네이티브 dismiss 를 흉내내지 않으므로 onDismiss 를 붙잡아 두었다가 직접 호출한다.
const captureDismiss = (): (() => void) =>
  screen.getByTestId("popover-overlay").props.onDismiss;

describe("LinkContextMenu", () => {
  test("기본은 링크 카드만 보이고 메뉴는 닫혀 있다", async () => {
    await renderMenu();

    expect(screen.getByText(link.title)).toBeOnTheScreen();
    expect(screen.queryByText("폴더 이동")).toBeNull();
  });

  test("길게 누르면 폴더 이동·링크 공유·삭제가 열린다", async () => {
    await renderMenu();
    await fireEvent(screen.getByLabelText(link.title), "longPress");

    expect(screen.getByText("폴더 이동")).toBeOnTheScreen();
    expect(screen.getByText("링크 공유")).toBeOnTheScreen();
    expect(screen.getByText("삭제")).toBeOnTheScreen();
  });

  test("탭하면 메뉴 대신 링크를 연다", async () => {
    const onOpenLink = jest.fn();
    await renderMenu({ onOpenLink });
    await fireEvent.press(screen.getByLabelText(link.title));

    expect(onOpenLink).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("폴더 이동")).toBeNull();
  });

  // 이동 시트·삭제 다이얼로그는 또 다른 Modal 이라 메뉴가 사라진 뒤에 열어야 나타난다.
  test.each([
    ["폴더 이동", "onMove"],
    ["삭제", "onDelete"],
  ] as const)("%s 는 메뉴가 닫힌 뒤에 실행한다", async (label, prop) => {
    const handler = jest.fn();
    await renderMenu({ [prop]: handler });
    await fireEvent(screen.getByLabelText(link.title), "longPress");
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText(label));

    expect(handler).not.toHaveBeenCalled();
    await act(async () => dismiss());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // 최근 삭제된 링크는 되돌리는 것 말고는 할 수 있는 게 없다 (Figma 62:7567).
  describe("최근 삭제 폴더", () => {
    test("복구하기 하나만 보여준다", async () => {
      await renderMenu({ variant: "trash", onRestore: () => {} });
      await fireEvent(screen.getByLabelText(link.title), "longPress");

      expect(screen.getByText("복구하기")).toBeOnTheScreen();
      expect(screen.queryByText("폴더 이동")).toBeNull();
      expect(screen.queryByText("링크 공유")).toBeNull();
      expect(screen.queryByText("삭제")).toBeNull();
    });

    test("복구하기를 누르면 onRestore 를 호출한다", async () => {
      const onRestore = jest.fn();
      await renderMenu({ variant: "trash", onRestore });
      await fireEvent(screen.getByLabelText(link.title), "longPress");
      const dismiss = captureDismiss();
      await fireEvent.press(screen.getByText("복구하기"));
      await act(async () => dismiss());

      expect(onRestore).toHaveBeenCalledTimes(1);
    });
  });

  test("링크 공유를 누르면 onShare 를 호출한다", async () => {
    const onShare = jest.fn();
    await renderMenu({ onShare });
    await fireEvent(screen.getByLabelText(link.title), "longPress");
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText("링크 공유"));
    await act(async () => dismiss());

    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
