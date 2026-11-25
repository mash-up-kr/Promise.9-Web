jest.mock("@shared/api", () => ({
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));
const mockLogout = jest.fn();
jest.mock("@shared/entities/auth/auth.queries", () => ({
  useLogoutMutation: () => ({ mutateAsync: mockLogout, isPending: false }),
}));
jest.mock("@/lib/notifications", () => ({
  unregisterPushToken: jest.fn().mockResolvedValue(undefined),
}));
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { clearTokens, getRefreshToken } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { unregisterPushToken } from "@/lib/notifications";

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

// 서버 로그아웃이 세션을 폐기하면 토큰 해제 요청이 인증에 실패한다.
test("서버 로그아웃 전에 이 기기의 푸시 토큰을 해제한다", async () => {
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(
    jest.mocked(unregisterPushToken).mock.invocationCallOrder[0],
  ).toBeLessThan(mockLogout.mock.invocationCallOrder[0] ?? 0);
});

// 해제 요청이 401 로 액세스 토큰을 갱신하면 리프레시 토큰도 회전된다 — 폐기된 옛 토큰으로 로그아웃하면 새 세션이 남는다.
test("푸시 해제가 끝난 뒤의 리프레시 토큰으로 서버 로그아웃한다", async () => {
  jest.mocked(unregisterPushToken).mockImplementationOnce(async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("rtk-2");
  });
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(mockLogout).toHaveBeenCalledWith("rtk-2");
});

test("로그아웃 중에는 진행 중으로 보이고, 다시 눌러도 한 번만 처리한다", async () => {
  let finishUnregister: () => void = () => {};
  jest.mocked(unregisterPushToken).mockReturnValueOnce(
    new Promise((resolve) => {
      finishUnregister = () => resolve();
    }),
  );
  const { result } = await renderWithClient();

  let first: Promise<void> = Promise.resolve();
  await act(async () => {
    first = result.current.logout();
  });
  expect(result.current.isPending).toBe(true);
  await act(async () => {
    await result.current.logout();
  });

  await act(async () => {
    finishUnregister();
    await first;
  });
  expect(unregisterPushToken).toHaveBeenCalledTimes(1);
  expect(mockLogout).toHaveBeenCalledTimes(1);
});
