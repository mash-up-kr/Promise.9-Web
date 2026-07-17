import { listLinks } from "@mocks/store";
import { setupMockApi } from "@mocks/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import { Suspense } from "react";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { CategoriesScreen } from "./CategoriesScreen";

const mockNavigate = jest.fn();
const mockSetParams = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  // 검색 아이콘이 헤더에 있어, 헤더를 실제로 렌더해 통합 검증한다.
  Stack: {
    Screen: ({ options }: { options?: { header?: () => React.ReactNode } }) =>
      options?.header ? options.header() : null,
  },
  useRouter: () => ({
    navigate: mockNavigate,
    setParams: mockSetParams,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetParams.mockClear();
  mockParams = {};
  setupMockApi();
});

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={metrics}>
        <Suspense fallback={null}>
          <CategoriesScreen />
        </Suspense>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("CategoriesScreen", () => {
  test("파라미터가 없으면 '전체' 탭이 선택되고 스토어 링크를 보여준다", async () => {
    const first = listLinks().items[0];
    await renderScreen();

    expect(screen.getByRole("button", { name: "전체" })).toBeSelected();
    expect(await screen.findByText(first.title)).toBeOnTheScreen();
  });

  test("category 파라미터로 진입하면 그 카테고리 링크만 보여준다", async () => {
    mockParams = { category: "디자인" };
    const designFirst = listLinks({ category: "디자인" }).items[0];
    await renderScreen();

    expect(screen.getByRole("button", { name: "디자인" })).toBeSelected();
    expect(await screen.findByText(designFirst.title)).toBeOnTheScreen();
  });

  test("탭을 누르면 선택한 카테고리를 URL 파라미터에 반영한다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "디자인" }));

    expect(mockSetParams).toHaveBeenCalledWith({ category: "디자인" });
  });

  test("'전체' 탭을 누르면 category 파라미터를 비운다", async () => {
    mockParams = { category: "디자인" };
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "전체" }));

    expect(mockSetParams).toHaveBeenCalledWith({ category: undefined });
  });

  test("헤더 검색 아이콘을 누르면 검색 화면으로 이동한다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "검색" }));

    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });
});
