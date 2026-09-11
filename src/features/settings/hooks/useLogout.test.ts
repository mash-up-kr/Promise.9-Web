jest.mock("@shared/api", () => ({
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));
const mockLogout = jest.fn();
jest.mock("@shared/entities/auth/auth.queries", () => ({
  useLogoutMutation: () => ({ mutateAsync: mockLogout, isPending: false }),
}));
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { clearTokens, getRefreshToken } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";

import { useLogout } from "./useLogout";

// 로그아웃·탈퇴 뒤 다음 로그인(다른 계정일 수 있다)이 이전 계정의 캐시를 보지 않도록 비운다.
const queryClient = new QueryClient();
const clearCache = jest.spyOn(queryClient, "clear");
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);
const renderWithClient = () => renderHook(() => useLogout(), { wrapper });

beforeEach(() => {
  jest.clearAllMocks();
  (getRefreshToken as jest.Mock).mockResolvedValue("rtk-1");
  mockLogout.mockResolvedValue(undefined);
});

test("서버 로그아웃 후 토큰을 지우고 로그인으로 이동한다", async () => {
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(mockLogout).toHaveBeenCalledWith("rtk-1");
  expect(clearTokens).toHaveBeenCalled();
  expect(clearCache).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});

test("서버 로그아웃이 실패해도 토큰을 지우고 로그인으로 이동한다", async () => {
  mockLogout.mockRejectedValue(new Error("500"));
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(clearTokens).toHaveBeenCalled();
  expect(clearCache).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});

test("refreshToken 이 없으면 서버 호출을 건너뛰고 로그인으로 이동한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue(null);
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(mockLogout).not.toHaveBeenCalled();
  expect(clearTokens).toHaveBeenCalled();
  expect(clearCache).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});
