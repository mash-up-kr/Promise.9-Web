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

// 리뷰 메모: 세션이 이미 없는 상태(비정상 진입)에서도 서버에 빈 문자열로 요청을 보내
// 실패로 수렴시킨다(YAGNI — 별도 분기 없이 동일 실패 경로). 메시지가 "다시 시도해주세요"로
// 뜨는 건 부정확할 수 있으나, 현재는 이 동작을 의도로 보고 고정한다. 문구를 "세션 만료"로
// 분기하는 건 후속 작업(plan/settings-auth-actions-followup.md 2.2)으로 남겨둔다.
test("refreshToken 이 없어도(비정상 세션) 서버에 요청을 보내고 실패로 처리한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue(null);
  mockWithdraw.mockRejectedValue(new Error("400"));
  const { result } = await renderHook(() => useWithdraw());
  await result.current.withdraw();
  expect(mockWithdraw).toHaveBeenCalledWith("");
  expect(clearTokens).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockShow).toHaveBeenCalledWith({
    message: "회원 탈퇴에 실패했어요. 다시 시도해주세요.",
  });
});
