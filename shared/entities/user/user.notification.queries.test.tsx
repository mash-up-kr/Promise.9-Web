// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 에러 유틸은 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return {
    apiClient: { get: jest.fn(), patch: jest.fn() },
    ...errors,
  };
});

import { apiClient, NetworkError } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";

import {
  notificationSettingsQueries,
  useUpdateNotificationSettingsMutation,
} from "./user.notification.queries";

const get = apiClient.get as jest.Mock;
const patch = apiClient.patch as jest.Mock;

const ok = <T,>(data: T) => ({ data: { success: true, data } });

// gcTime 타이머가 남으면 jest 가 끝나지 않는다.
const newQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
    },
  });

function setup() {
  const queryClient = newQueryClient();
  queryClient.setQueryData(notificationSettingsQueries.detail().queryKey, {
    email: true,
    push: true,
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const cached = () =>
    queryClient.getQueryData(notificationSettingsQueries.detail().queryKey);
  return { queryClient, wrapper, cached };
}

beforeEach(() => jest.clearAllMocks());

describe("notificationSettingsQueries.detail", () => {
  it("GET /users/me/notification-settings 응답을 검증해 돌려준다", async () => {
    get.mockResolvedValue(ok({ email: false, push: true }));
    const queryClient = newQueryClient();

    const result = await queryClient.fetchQuery(
      notificationSettingsQueries.detail(),
    );

    expect(get).toHaveBeenCalledWith("/users/me/notification-settings", {
      signal: expect.any(AbortSignal),
    });
    expect(result).toEqual({ email: false, push: true });
  });

  it("채널 값이 boolean 이 아니면 실패한다", async () => {
    get.mockResolvedValue(ok({ email: "on", push: true }));

    await expect(
      newQueryClient().fetchQuery(notificationSettingsQueries.detail()),
    ).rejects.toThrow();
  });
});

describe("useUpdateNotificationSettingsMutation", () => {
  it("바꾼 채널만 보내고, 응답 전체로 캐시를 맞춘다", async () => {
    patch.mockResolvedValue(ok({ email: false, push: true }));
    const { wrapper, cached } = setup();
    const { result } = await renderHook(
      () => useUpdateNotificationSettingsMutation(),
      { wrapper },
    );

    await act(() => result.current.mutateAsync({ email: false }));

    expect(patch).toHaveBeenCalledWith("/users/me/notification-settings", {
      email: false,
    });
    expect(cached()).toEqual({ email: false, push: true });
  });

  it("요청이 끝나기 전에 캐시에 먼저 반영한다", async () => {
    patch.mockReturnValue(new Promise(() => {}));
    const { wrapper, cached } = setup();
    const { result } = await renderHook(
      () => useUpdateNotificationSettingsMutation(),
      { wrapper },
    );

    await act(async () => result.current.mutate({ email: false }));

    await waitFor(() => expect(cached()).toEqual({ email: false, push: true }));
  });

  it("실패하면 이전 값으로 되돌린다", async () => {
    patch.mockRejectedValue(new NetworkError());
    const { wrapper, cached } = setup();
    const { result } = await renderHook(
      () => useUpdateNotificationSettingsMutation(),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ email: false }).catch(() => {});
    });

    expect(cached()).toEqual({ email: true, push: true });
  });
});
