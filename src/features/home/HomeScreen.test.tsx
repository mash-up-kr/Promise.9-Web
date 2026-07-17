import { setupMockApi } from "@mocks/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { HomeScreen } from "./HomeScreen";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  setupMockApi();
});

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={metrics}>
        <HomeScreen />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("HomeScreen", () => {
  test("최근 저장 섹션과 폴더 그룹 타이틀을 보여준다", async () => {
    await renderScreen();

    expect(await screen.findByText("최근 저장")).toBeOnTheScreen();
    expect(screen.getByText("마지막으로 저장한 폴더 순")).toBeOnTheScreen();
  });

  test("스토어의 폴더들을 섹션으로 렌더한다", async () => {
    await renderScreen();

    expect(await screen.findByText("매쉬업 활동")).toBeOnTheScreen();
    expect(await screen.findByText("제주도 여행")).toBeOnTheScreen();
    expect(await screen.findByText("위시리스트")).toBeOnTheScreen();
  });
});
