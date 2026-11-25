jest.mock("@shared/api", () => ({
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));
jest.mock("@/lib/pendingLogout", () => ({
  sendLogout: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/notifications", () => ({
  takePushToken: jest.fn().mockResolvedValue("ExpoPushToken[a]"),
}));
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { clearTokens, getRefreshToken } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { takePushToken } from "@/lib/notifications";
import { sendLogout } from "@/lib/pendingLogout";

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
});

test("이 기기의 푸시 토큰과 함께 서버 로그아웃한 뒤 토큰을 지우고 로그인으로 이동한다", async () => {
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(sendLogout).toHaveBeenCalledWith({
    refreshToken: "rtk-1",
    pushToken: "ExpoPushToken[a]",
  });
  expect(clearTokens).toHaveBeenCalled();
  expect(clearCache).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});

test("refreshToken 이 없으면 서버 호출을 건너뛰고 로그인으로 이동한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue(null);
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(takePushToken).not.toHaveBeenCalled();
  expect(sendLogout).not.toHaveBeenCalled();
  expect(clearTokens).toHaveBeenCalled();
  expect(clearCache).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
});

// 진행 중인 토큰 등록이 액세스 토큰을 갱신하면 리프레시 토큰도 회전된다 — 폐기된 옛 토큰으로 로그아웃하면 새 세션이 남는다.
test("푸시 토큰을 꺼낸 뒤의 리프레시 토큰으로 서버 로그아웃한다", async () => {
  jest.mocked(takePushToken).mockImplementationOnce(async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("rtk-2");
    return null;
  });
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(sendLogout).toHaveBeenCalledWith({
    refreshToken: "rtk-2",
    pushToken: null,
  });
});

test("푸시 토큰을 꺼내는 사이 세션이 거절돼도 처음 읽은 리프레시 토큰으로 푸시 토큰을 해제한다", async () => {
  jest.mocked(takePushToken).mockImplementationOnce(async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue(null);
    return "ExpoPushToken[a]";
  });
  const { result } = await renderWithClient();
  await result.current.logout();
  expect(sendLogout).toHaveBeenCalledWith({
    refreshToken: "rtk-1",
    pushToken: "ExpoPushToken[a]",
  });
});

test("로그아웃 중에는 진행 중으로 보이고, 다시 눌러도 한 번만 처리한다", async () => {
  let finishTake: () => void = () => {};
  jest.mocked(takePushToken).mockReturnValueOnce(
    new Promise((resolve) => {
      finishTake = () => resolve(null);
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
    finishTake();
    await first;
  });
  expect(takePushToken).toHaveBeenCalledTimes(1);
  expect(sendLogout).toHaveBeenCalledTimes(1);
});
