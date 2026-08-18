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
