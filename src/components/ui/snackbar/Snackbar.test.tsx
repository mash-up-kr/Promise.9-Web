// iOS 만 투명 모달 라우트를 네이티브 모달로 띄운다 — 테스트별로 플랫폼을 바꿔 본다.
const mockPlatform = { isIOS: true };
jest.mock("@/constants/platform.constants", () => ({
  get isIOS() {
    return mockPlatform.isIOS;
  },
  get isAndroid() {
    return !mockPlatform.isIOS;
  },
  isWeb: false,
  isServer: false,
}));

afterEach(() => {
  mockPlatform.isIOS = true;
});

import {
  act,
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  SnackbarOutlet,
  SnackbarProvider,
  useSnackbar,
} from "./SnackbarProvider";

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Harness({
  message = "링크를 저장했어요.",
  action,
  icon,
}: {
  message?: string;
  action?: { label: string; onPress: () => void };
  icon?: ReactNode;
}) {
  const { show } = useSnackbar();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="show"
      onPress={() => show({ message, action, icon })}
    >
      <Text>trigger</Text>
    </Pressable>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <SnackbarProvider>{ui}</SnackbarProvider>
    </SafeAreaProvider>,
  );
}

describe("Snackbar", () => {
  test("처음엔 스낵바가 없다", async () => {
    await renderWithProvider(<Harness />);
    expect(screen.queryByText("링크를 저장했어요.")).toBeNull();
  });

  test("show 하면 메시지와 액션이 뜬다", async () => {
    const user = userEvent.setup();
    await renderWithProvider(
      <Harness action={{ label: "실행 취소", onPress: jest.fn() }} />,
    );
    await user.press(screen.getByLabelText("show"));
    expect(screen.getByText("링크를 저장했어요.")).toBeOnTheScreen();
    expect(screen.getByText("실행 취소")).toBeOnTheScreen();
  });

  test("액션을 누르면 onPress 호출 후 스낵바가 사라진다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await renderWithProvider(
      <Harness action={{ label: "실행 취소", onPress }} />,
    );
    await user.press(screen.getByLabelText("show"));
    await user.press(screen.getByText("실행 취소"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("링크를 저장했어요.")).toBeNull();
  });

  test("액션이 없으면(오프라인) 액션 버튼이 없다", async () => {
    const user = userEvent.setup();
    await renderWithProvider(
      <Harness message="오프라인 상태예요. 연결되면 저장할게요." />,
    );
    await user.press(screen.getByLabelText("show"));
    expect(
      screen.getByText("오프라인 상태예요. 연결되면 저장할게요."),
    ).toBeOnTheScreen();
    expect(screen.queryByText("실행 취소")).toBeNull();
  });

  test("2500ms 이 지나면 자동으로 사라진다", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    try {
      await renderWithProvider(<Harness />);
      await user.press(screen.getByLabelText("show"));
      expect(screen.getByText("링크를 저장했어요.")).toBeOnTheScreen();
      await act(async () => {
        jest.advanceTimersByTime(2400);
      });
      expect(screen.getByText("링크를 저장했어요.")).toBeOnTheScreen();
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
      expect(screen.queryByText("링크를 저장했어요.")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test("icon 을 넘기면 아이콘이 함께 뜬다", async () => {
    const user = userEvent.setup();
    await renderWithProvider(<Harness icon={<View testID="stub-icon" />} />);
    await user.press(screen.getByLabelText("show"));
    expect(screen.getByTestId("stub-icon")).toBeOnTheScreen();
  });

  test("icon 을 넘기지 않으면 아이콘 자리가 없다", async () => {
    const user = userEvent.setup();
    await renderWithProvider(<Harness />);
    await user.press(screen.getByLabelText("show"));
    expect(screen.queryByTestId("stub-icon")).toBeNull();
  });

  test("긴 메시지가 한 줄로 잘리지 않고 여러 줄로 보인다", async () => {
    const user = userEvent.setup();
    const longMessage = "오프라인 상태예요. 연결되면 저장할게요.";
    await renderWithProvider(<Harness message={longMessage} />);
    await user.press(screen.getByLabelText("show"));
    const messageText = screen.getByText(longMessage);
    expect(messageText.props.numberOfLines).toBeUndefined();
  });

  // 시트 라우트(투명 모달)는 루트 위에 따로 뜨는 화면이라, 루트에 그린 스낵바는 그 아래에 깔린다.
  describe("시트 라우트 위의 스낵바", () => {
    function App({ isSheetOpen }: { isSheetOpen: boolean }) {
      return (
        <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
          <SnackbarProvider>
            <Harness />
            {isSheetOpen && (
              <View testID="sheet-route">
                <SnackbarOutlet />
              </View>
            )}
          </SnackbarProvider>
        </SafeAreaProvider>
      );
    }

    test("시트 라우트가 열려 있으면 스낵바를 그 화면 안에 그린다", async () => {
      const user = userEvent.setup();
      await render(<App isSheetOpen />);

      await user.press(screen.getByLabelText("show"));

      expect(
        within(screen.getByTestId("sheet-route")).getByText(
          "링크를 저장했어요.",
        ),
      ).toBeOnTheScreen();
      expect(screen.getAllByText("링크를 저장했어요.")).toHaveLength(1);
    });

    // 저장 성공처럼 스낵바를 띄우고 바로 시트를 닫아도 아래 화면에서 이어서 보인다.
    // Android·웹은 루트 스낵바가 시트 위에 그대로 보인다.
    test("iOS 가 아니면 시트 라우트가 열려 있어도 루트에 그린다", async () => {
      mockPlatform.isIOS = false;
      const user = userEvent.setup();
      await render(<App isSheetOpen />);

      await user.press(screen.getByLabelText("show"));

      expect(
        within(screen.getByTestId("sheet-route")).queryByText(
          "링크를 저장했어요.",
        ),
      ).toBeNull();
      expect(screen.getByText("링크를 저장했어요.")).toBeOnTheScreen();
    });

    test("시트 라우트가 닫히면 떠 있던 스낵바를 아래 화면에 이어서 그린다", async () => {
      const user = userEvent.setup();
      await render(<App isSheetOpen />);
      await user.press(screen.getByLabelText("show"));

      await screen.rerender(<App isSheetOpen={false} />);

      expect(screen.queryByTestId("sheet-route")).toBeNull();
      expect(screen.getByText("링크를 저장했어요.")).toBeOnTheScreen();
    });
  });
});
