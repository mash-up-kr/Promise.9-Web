import { getLinkDetail } from "@mocks/store";
import { setupMockApi } from "@mocks/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import { Suspense } from "react";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { LinkDetailScreen } from "./LinkDetailScreen";

// Stack.Screen 은 헤더를 options.header 로만 받으므로, header 를 실제로 렌더해 헤더의 즐겨찾기를 검증한다.
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options?: { header?: () => React.ReactNode } }) =>
      options?.header?.() ?? null,
  },
  useLocalSearchParams: () => ({ id: "1" }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  canGoBack: () => true,
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  setupMockApi();
});

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={metrics}>
        <Suspense fallback={null}>
          <LinkDetailScreen />
        </Suspense>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("LinkDetailScreen", () => {
  test("스토어 링크(id=1)의 제목을 렌더한다", async () => {
    const detail = getLinkDetail(1);
    await renderScreen();
    expect(await screen.findByText(detail?.title ?? "")).toBeOnTheScreen();
  });

  test("즐겨찾기 탭 → 선택 상태가 토글된다", async () => {
    await renderScreen();
    const favoriteButton = () =>
      screen.getByRole("button", { name: "즐겨찾기" });
    await screen.findByRole("button", { name: "즐겨찾기" });

    const initial = favoriteButton().props.accessibilityState.selected;
    const user = userEvent.setup();
    await user.press(favoriteButton());
    expect(favoriteButton().props.accessibilityState.selected).toBe(!initial);
  });

  test("태그 추가 → 화면에 새 태그 칩이 반영된다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(await screen.findByRole("button", { name: "태그 추가" }));
    await user.type(
      screen.getByPlaceholderText("태그를 입력해 주세요"),
      "회고",
    );
    await user.press(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("#회고")).toBeOnTheScreen();
  });

  test("함께 다시 볼 링크 섹션을 렌더한다", async () => {
    await renderScreen();
    expect(await screen.findByText("함께 다시 볼 링크")).toBeOnTheScreen();
  });
});
