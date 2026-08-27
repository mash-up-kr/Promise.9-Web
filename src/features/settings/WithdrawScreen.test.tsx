const mockWithdraw = jest.fn();
jest.mock("./hooks/useWithdraw", () => ({
  useWithdraw: () => ({ withdraw: mockWithdraw, isPending: false }),
}));

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ canGoBack: () => true, back: jest.fn() }),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WithdrawScreen } from "./WithdrawScreen";

const renderScreen = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <WithdrawScreen />
    </SafeAreaProvider>,
  );

describe("WithdrawScreen", () => {
  beforeEach(() => {
    mockWithdraw.mockClear();
  });

  test("경고 문구와 탈퇴 버튼을 렌더한다", async () => {
    await renderScreen();
    expect(screen.getByText("링띵동을 정말 떠나시나요?")).toBeOnTheScreen();
    expect(
      screen.getByText("지금까지 저장된 링크, 폴더 내역이 모두 사라져요."),
    ).toBeOnTheScreen();
    expect(screen.getByText("탈퇴하기")).toBeOnTheScreen();
  });

  test("탈퇴하기를 누르면 탈퇴를 실행한다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("탈퇴하기"));
    expect(mockWithdraw).toHaveBeenCalledTimes(1);
  });
});
