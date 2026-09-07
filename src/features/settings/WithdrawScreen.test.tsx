const mockWithdraw = jest.fn();
jest.mock("./hooks/useWithdraw", () => ({
  useWithdraw: () => ({ withdraw: mockWithdraw, isPending: false }),
}));

let mockAuthStatus = "authenticated";
jest.mock("@/features/auth/hooks/useAuthGate", () => ({
  useAuthGate: () => mockAuthStatus,
}));

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({
    canGoBack: () => true,
    back: jest.fn(),
    replace: mockReplace,
  }),
}));

import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
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
    mockReplace.mockClear();
    mockAuthStatus = "authenticated";
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

  // 스토어 정책: 앱을 다시 설치하지 않고도 삭제를 요청할 수 있는 웹페이지가 필요하다.
  // 웹에서 이 주소로 직접 들어온 비로그인 방문자에게 절차·보관 기간·문의처를 안내한다.
  test("로그아웃 상태면 탈퇴 버튼 대신 절차 안내와 로그인 버튼을 보여준다", async () => {
    mockAuthStatus = "unauthenticated";
    await renderScreen();

    expect(screen.getByText(/설정 → 회원 탈퇴/)).toBeOnTheScreen();
    expect(screen.getByText(/30일/)).toBeOnTheScreen();
    expect(screen.getByText(/2026promise\.9@gmail\.com/)).toBeOnTheScreen();
    expect(screen.queryByText("탈퇴하기")).toBeNull();

    await userEvent.setup().press(screen.getByText("로그인하러 가기"));

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(mockWithdraw).not.toHaveBeenCalled();
  });
});
