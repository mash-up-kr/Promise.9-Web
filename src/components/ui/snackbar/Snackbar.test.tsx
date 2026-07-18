import { act, render, screen, userEvent } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider, useSnackbar } from "./SnackbarProvider";

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Harness({
  message = "링크를 저장했어요.",
  action,
}: {
  message?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { show } = useSnackbar();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="show"
      onPress={() => show({ message, action })}
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

  test("일정 시간이 지나면 자동으로 사라진다", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    try {
      await renderWithProvider(<Harness />);
      await user.press(screen.getByLabelText("show"));
      expect(screen.getByText("링크를 저장했어요.")).toBeOnTheScreen();
      await act(async () => {
        jest.advanceTimersByTime(4000);
      });
      expect(screen.queryByText("링크를 저장했어요.")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
