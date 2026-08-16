import type { Link } from "@shared/types/link.types";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { LinkContextMenu } from "./LinkContextMenu";

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

const renderMenu = (
  props?: Partial<React.ComponentProps<typeof LinkContextMenu>>,
) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <LinkContextMenu
        link={link}
        onOpenLink={() => {}}
        onMove={() => {}}
        onShare={() => {}}
        onDelete={() => {}}
        {...props}
      />
    </SafeAreaProvider>,
  );

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
