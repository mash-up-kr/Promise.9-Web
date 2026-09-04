jest.mock("expo-share-extension", () => ({
  close: jest.fn(),
  openHostApp: jest.fn(),
}));
jest.mock("@shared/api", () => {
  const token = jest.requireActual("@shared/api/token");
  const contracts = jest.requireActual("@shared/api/auth.contracts");
  const errors = jest.requireActual("@shared/api/errors");
  return {
    apiClient: { get: jest.fn(), post: jest.fn() },
    ...token,
    ...contracts,
    ...errors,
  };
});
const mockGetIdToken = jest.fn();
jest.mock("@/features/auth/hooks/useSocialAuth", () => ({
  useSocialAuth: () => ({ getIdToken: mockGetIdToken }),
}));
let mockIsIOS = true;
jest.mock("@/constants/platform.constants", () => ({
  get isIOS() {
    return mockIsIOS;
  },
  get isAndroid() {
    return !mockIsIOS;
  },
}));

import { apiClient, getRefreshToken, setTokenPersistence } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { openHostApp } from "expo-share-extension";
import type { PropsWithChildren } from "react";

import { SocialLoginCancelledError } from "@/features/auth/auth.errors";

import {
  EXTENSION_LOGIN_FAILED_MESSAGE,
  useExtensionSocialLogin,
} from "./useExtensionSocialLogin";

const mockPost = apiClient.post as jest.Mock;

const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider
    client={
      new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    }
  >
    {children}
  </QueryClientProvider>
);

let stored: string | null = null;
beforeEach(() => {
  jest.clearAllMocks();
  mockIsIOS = true;
  stored = null;
  setTokenPersistence({
    getRefreshToken: async () => stored,
    setRefreshToken: async (token) => {
      stored = token;
    },
  });
});

test("구글 로그인 성공 → 서버 로그인 후 토큰이 저장된다", async () => {
  mockGetIdToken.mockResolvedValue("google-id-token");
  mockPost.mockResolvedValue({
    data: {
      success: true,
      data: { accessToken: "atk", refreshToken: "rtk", isNewUser: false },
    },
  });
  const { result } = await renderHook(
    () => useExtensionSocialLogin("https://toss.tech/a"),
    { wrapper },
  );

  await act(() => result.current.login("google"));

  expect(mockPost).toHaveBeenCalledWith("/auth/social", {
    provider: "google",
    idToken: "google-id-token",
  });
  await expect(getRefreshToken()).resolves.toBe("rtk");
  expect(result.current.pendingProvider).toBeNull();
  expect(result.current.errorMessage).toBeNull();
});

test("iOS 카카오는 익스텐션에서 끝낼 수 없어 앱 로그인으로 인계한다", async () => {
  const { result } = await renderHook(
    () => useExtensionSocialLogin("https://toss.tech/a"),
    { wrapper },
  );

  await act(() => result.current.login("kakao"));

  expect(openHostApp).toHaveBeenCalledWith(
    `login?next=${encodeURIComponent(
      `/create-link?url=${encodeURIComponent("https://toss.tech/a")}`,
    )}`,
  );
  expect(mockGetIdToken).not.toHaveBeenCalled();
});

test("Android 카카오는 그 자리에서 진행한다", async () => {
  mockIsIOS = false;
  mockGetIdToken.mockResolvedValue("kakao-id-token");
  mockPost.mockResolvedValue({
    data: {
      success: true,
      data: { accessToken: "atk", refreshToken: "rtk", isNewUser: false },
    },
  });
  const { result } = await renderHook(
    () => useExtensionSocialLogin("https://toss.tech/a"),
    { wrapper },
  );

  await act(() => result.current.login("kakao"));

  expect(openHostApp).not.toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledWith("/auth/social", {
    provider: "kakao",
    idToken: "kakao-id-token",
  });
});

test("취소는 오류 없이 원복한다", async () => {
  mockGetIdToken.mockRejectedValue(new SocialLoginCancelledError());
  const { result } = await renderHook(
    () => useExtensionSocialLogin("https://toss.tech/a"),
    { wrapper },
  );

  await act(() => result.current.login("google"));

  expect(result.current.pendingProvider).toBeNull();
  expect(result.current.errorMessage).toBeNull();
  expect(mockPost).not.toHaveBeenCalled();
});

test("실패하면 오류 문구를 노출하고 다시 시도할 수 있다", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  mockGetIdToken.mockRejectedValue(new Error("sdk"));
  const { result } = await renderHook(
    () => useExtensionSocialLogin("https://toss.tech/a"),
    { wrapper },
  );

  await act(() => result.current.login("google"));

  await waitFor(() =>
    expect(result.current.errorMessage).toBe(EXTENSION_LOGIN_FAILED_MESSAGE),
  );
  expect(result.current.pendingProvider).toBeNull();
  errorSpy.mockRestore();
});
