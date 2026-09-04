// 애플은 iOS 네이티브만 지원한다 — 미지원 플랫폼(웹·안드로이드)에선 버튼 자체를 숨긴다.
// SOCIAL_PROVIDERS.apple.enabled 는 모듈 로드 시점의 isIOS 로 결정되므로, 렌더 전에
// platform.constants 를 비-iOS 로 갈아끼운 뒤 LoginScreen 을 불러온다.
jest.mock("@/constants/platform.constants", () => ({
  isIOS: false,
  isAndroid: true,
  isWeb: false,
  isServer: false,
}));

// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 한다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  const token = jest.requireActual("@shared/api/token");
  const contracts = jest.requireActual("@shared/api/auth.contracts");
  return {
    apiClient: { get: jest.fn(), post: jest.fn() },
    ...errors,
    ...token,
    ...contracts,
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { LoginScreen } from "./LoginScreen";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SafeAreaProvider initialMetrics={metrics}>
        <SnackbarProvider>
          <LoginScreen />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );

test("애플 미지원 플랫폼(웹·안드로이드)에선 애플 버튼을 렌더하지 않는다", async () => {
  await renderScreen();

  expect(screen.queryByRole("button", { name: "Apple로 계속하기" })).toBeNull();
  // 카카오·구글은 그대로 노출한다.
  expect(
    screen.getByRole("button", { name: "카카오로 계속하기" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Google로 계속하기" }),
  ).toBeTruthy();
});
