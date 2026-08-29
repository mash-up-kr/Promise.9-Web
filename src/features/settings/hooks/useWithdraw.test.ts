jest.mock("@shared/api", () => ({
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));
const mockWithdraw = jest.fn();
jest.mock("../api/auth-actions.queries", () => ({
  useWithdrawMutation: () => ({ mutateAsync: mockWithdraw, isPending: false }),
}));
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
const mockShow = jest.fn();
jest.mock("@/components/ui/snackbar/SnackbarProvider", () => ({
  useSnackbar: () => ({ show: mockShow }),
}));

import { clearTokens, getRefreshToken } from "@shared/api";
import { renderHook } from "@testing-library/react-native";

import { useWithdraw } from "./useWithdraw";

beforeEach(() => {
  jest.clearAllMocks();
  (getRefreshToken as jest.Mock).mockResolvedValue("rtk-1");
  mockWithdraw.mockResolvedValue(undefined);
});

test("탈퇴 성공 시 토큰을 지우고 로그인으로 이동한다", async () => {
  const { result } = await renderHook(() => useWithdraw());
  await result.current.withdraw();
  expect(mockWithdraw).toHaveBeenCalledWith("rtk-1");
  expect(clearTokens).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});

test("탈퇴 실패 시 세션을 유지하고 스낵바로 안내한다", async () => {
  mockWithdraw.mockRejectedValue(new Error("500"));
  const { result } = await renderHook(() => useWithdraw());
  await result.current.withdraw();
  expect(clearTokens).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockShow).toHaveBeenCalledWith({
    message: "회원 탈퇴에 실패했어요. 다시 시도해주세요.",
  });
});

// refreshToken 이 없으면(비정상 세션) 서버 탈퇴는 성공할 수 없다(세션 자체가 없음).
// 재시도로 풀 수 없는 상황이라 "다시 시도" 대신 재로그인을 안내하고, 로컬 세션을 정리한 뒤
// 로그인 화면으로 보낸다(useLogout 의 refreshToken 부재 처리와 동일한 방향 — issue #74).
test("refreshToken 이 없으면 서버 요청 없이 세션 만료를 안내하고 로그인으로 이동한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue(null);
  const { result } = await renderHook(() => useWithdraw());
  await result.current.withdraw();
  expect(mockWithdraw).not.toHaveBeenCalled();
  expect(clearTokens).toHaveBeenCalled();
  expect(mockShow).toHaveBeenCalledWith({
    message: "세션이 만료됐어요. 다시 로그인해주세요.",
  });
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});
