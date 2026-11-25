import { apiClient, setTokens } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useSocialLoginMutation } from "./auth.queries";

const mockTrackEvent = jest.fn(() => false);
jest.mock("@/components/analytics/AnalyticsContext", () => ({
  useAnalytics: () => ({ trackEvent: mockTrackEvent }),
}));
jest.mock("@shared/api", () => ({
  apiClient: { post: jest.fn() },
  setTokens: jest.fn().mockResolvedValue(undefined),
  socialLoginResponseSchema: jest.requireActual("@shared/api/auth.contracts")
    .socialLoginResponseSchema,
}));

beforeEach(() => jest.clearAllMocks());

async function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: 0 } },
  });
  return renderHook(() => useSocialLoginMutation(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

test.each([
  true,
  false,
])("신규 가입 여부(%s)에 따라 기록하고 수집이 거절되어도 토큰을 저장한다", async (isNewUser) => {
  const response = {
    accessToken: "access",
    refreshToken: "refresh",
    isNewUser,
  };
  jest.mocked(apiClient.post).mockResolvedValue({ data: { data: response } });
  const { result } = await setup();
  await act(async () => {
    await expect(
      result.current.mutateAsync({ provider: "google", idToken: "id-token" }),
    ).resolves.toEqual(response);
  });
  expect(setTokens).toHaveBeenCalledWith("access", "refresh");
  expect(mockTrackEvent).toHaveBeenCalledTimes(isNewUser ? 2 : 1);
  expect(mockTrackEvent).toHaveBeenNthCalledWith(
    1,
    {
      event_name: "login_completed",
      custom_data: { provider: "google" },
    },
    { flushSoon: true },
  );
  if (isNewUser) {
    expect(mockTrackEvent).toHaveBeenCalledWith(
      {
        event_name: "signup_completed",
        custom_data: { provider: "google" },
      },
      { flushSoon: true },
    );
  }
});

test("인증 API 실패 시 가입 완료 이벤트와 토큰을 남기지 않는다", async () => {
  jest.mocked(apiClient.post).mockRejectedValue(new Error("login failed"));
  const { result } = await setup();
  await act(async () => {
    await expect(
      result.current.mutateAsync({ provider: "google", idToken: "id-token" }),
    ).rejects.toThrow("login failed");
  });
  expect(mockTrackEvent).not.toHaveBeenCalled();
  expect(setTokens).not.toHaveBeenCalled();
});

test("토큰 저장이 완료되기 전에는 로그인·가입 완료를 기록하지 않는다", async () => {
  let finish = () => {};
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  jest.mocked(setTokens).mockReturnValueOnce(pending);
  jest.mocked(apiClient.post).mockResolvedValue({
    data: {
      data: {
        accessToken: "access",
        refreshToken: "refresh",
        isNewUser: true,
      },
    },
  });
  const { result } = await setup();
  await act(async () => {
    const login = result.current.mutateAsync({
      provider: "google",
      idToken: "id-token",
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(setTokens).toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
    finish();
    await login;
  });
  expect(mockTrackEvent).toHaveBeenCalledTimes(2);
});

test("토큰 저장 실패 시 로그인·가입 완료를 기록하지 않는다", async () => {
  jest.mocked(setTokens).mockRejectedValueOnce(new Error("storage failed"));
  jest.mocked(apiClient.post).mockResolvedValue({
    data: {
      data: {
        accessToken: "access",
        refreshToken: "refresh",
        isNewUser: true,
      },
    },
  });
  const { result } = await setup();
  await act(async () => {
    await expect(
      result.current.mutateAsync({ provider: "google", idToken: "id-token" }),
    ).rejects.toThrow("storage failed");
  });
  expect(mockTrackEvent).not.toHaveBeenCalled();
});
