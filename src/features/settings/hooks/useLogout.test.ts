jest.mock("@shared/api", () => ({
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));
const mockLogout = jest.fn();
jest.mock("../api/auth-actions.queries", () => ({
  useLogoutMutation: () => ({ mutateAsync: mockLogout, isPending: false }),
}));
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { clearTokens, getRefreshToken } from "@shared/api";
import { renderHook } from "@testing-library/react-native";

import { useLogout } from "./useLogout";

beforeEach(() => {
  jest.clearAllMocks();
  (getRefreshToken as jest.Mock).mockResolvedValue("rtk-1");
  mockLogout.mockResolvedValue(undefined);
});

test("서버 로그아웃 후 토큰을 지우고 로그인으로 이동한다", async () => {
  const { result } = await renderHook(() => useLogout());
  await result.current.logout();
  expect(mockLogout).toHaveBeenCalledWith("rtk-1");
  expect(clearTokens).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});

test("서버 로그아웃이 실패해도 토큰을 지우고 로그인으로 이동한다", async () => {
  mockLogout.mockRejectedValue(new Error("500"));
  const { result } = await renderHook(() => useLogout());
  await result.current.logout();
  expect(clearTokens).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});

test("refreshToken 이 없으면 서버 호출을 건너뛰고 로그인으로 이동한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue(null);
  const { result } = await renderHook(() => useLogout());
  await result.current.logout();
  expect(mockLogout).not.toHaveBeenCalled();
  expect(clearTokens).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});
