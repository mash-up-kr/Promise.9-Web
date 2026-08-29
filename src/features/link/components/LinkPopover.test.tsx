import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LinkPopover } from "./LinkPopover";

const renderMenu = (props?: Partial<Parameters<typeof LinkPopover>[0]>) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <LinkPopover
        onMove={jest.fn()}
        onShare={jest.fn()}
        onDelete={jest.fn()}
        {...props}
      />
    </SafeAreaProvider>,
  );

// 팝오버는 iOS(테스트 환경 Platform.OS)에서 Modal 이 사라진 뒤에야 고른 동작을 실행한다.
// RNTL 은 네이티브 dismiss 를 흉내내지 않고, 닫히는 즉시 Modal 이 트리에서 사라지므로
// onDismiss 를 항목을 누르기 전에 붙잡아 뒀다가 직접 호출한다(LinkContextMenu.test 와 동일 패턴).
const captureDismiss = (): (() => void) =>
  screen.getByTestId("popover-overlay").props.onDismiss;

describe("LinkPopover", () => {
  test("처음에는 메뉴가 닫혀 있다", async () => {
    await renderMenu();
    expect(screen.queryByText("링크 공유")).toBeNull();
  });

  test("더보기를 누르면 세 항목이 나타난다", async () => {
    await renderMenu();
    await fireEvent.press(screen.getByLabelText("더보기"));
    expect(screen.getByText("폴더 이동")).toBeOnTheScreen();
    expect(screen.getByText("링크 공유")).toBeOnTheScreen();
    expect(screen.getByText("삭제")).toBeOnTheScreen();
  });

  test("삭제를 누르고 메뉴가 닫히면 onDelete 를 호출한다", async () => {
    const onDelete = jest.fn();
    await renderMenu({ onDelete });
    await fireEvent.press(screen.getByLabelText("더보기"));
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText("삭제"));
    expect(onDelete).not.toHaveBeenCalled(); // 아직 닫히는 중
    await act(async () => dismiss());
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test("링크 공유를 누르고 메뉴가 닫히면 onShare 를 호출한다", async () => {
    const onShare = jest.fn();
    await renderMenu({ onShare });
    await fireEvent.press(screen.getByLabelText("더보기"));
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText("링크 공유"));
    await act(async () => dismiss());
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
