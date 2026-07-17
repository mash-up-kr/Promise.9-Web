import { listLinks } from "@mocks/store";
import { setupMockApi } from "@mocks/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SearchScreen } from "./SearchScreen";

const mockPush = jest.fn();

// setParams → useLocalSearchParams 반영을 흉내내는 파라미터 스토어.
const mockParamsStore = {
  params: {} as Record<string, string>,
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    mockParamsStore.listeners.add(listener);
    return () => {
      mockParamsStore.listeners.delete(listener);
    };
  },
  getSnapshot() {
    return mockParamsStore.params;
  },
  setParams(next: Record<string, string | undefined>) {
    const merged = { ...mockParamsStore.params, ...next };
    mockParamsStore.params = Object.fromEntries(
      Object.entries(merged).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;
    for (const listener of mockParamsStore.listeners) {
      listener();
    }
  },
  reset(initial: Record<string, string> = {}) {
    mockParamsStore.params = initial;
    mockParamsStore.listeners.clear();
  },
};

jest.mock("expo-router", () => {
  const { useSyncExternalStore } =
    jest.requireActual<typeof import("react")>("react");
  return {
    // 검색 인풋이 헤더에 있어, 헤더를 실제로 렌더해 통합 검증한다.
    Stack: {
      Screen: ({
        options,
      }: {
        options?: { header?: () => React.ReactNode };
      }) => (options?.header ? options.header() : null),
    },
    useRouter: () => ({
      push: mockPush,
      back: jest.fn(),
      setParams: mockParamsStore.setParams,
    }),
    useLocalSearchParams: () =>
      useSyncExternalStore(
        mockParamsStore.subscribe,
        mockParamsStore.getSnapshot,
      ),
  };
});

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  mockPush.mockClear();
  mockParamsStore.reset();
  setupMockApi();
});

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={metrics}>
        <SearchScreen />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("SearchScreen", () => {
  test("초기 진입 시 최근 검색어·카테고리 둘러보기 섹션을 렌더한다", async () => {
    await renderScreen();

    expect(await screen.findByText("최근 검색어")).toBeOnTheScreen();
    expect(screen.getByText("카테고리 둘러보기")).toBeOnTheScreen();
  });

  test("q 파라미터로 진입하면 결과 상태로 시작하고 인풋 값을 복원한다", async () => {
    mockParamsStore.reset({ q: "디자인" });
    const first = listLinks({ search: "디자인" }).items[0];
    await renderScreen();

    expect(screen.getByDisplayValue("디자인")).toBeOnTheScreen();
    expect(await screen.findByText(first.title)).toBeOnTheScreen();
    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
  });

  test("카테고리 칩을 누르면 해당 카테고리의 둘러보기 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await screen.findByText("카테고리 둘러보기");

    await user.press(screen.getByRole("button", { name: "개발" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/search/categories",
      params: { category: "개발" },
    });
  });

  test("카테고리 둘러보기 타이틀을 누르면 둘러보기 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(
      await screen.findByRole("button", { name: "카테고리 둘러보기" }),
    );

    expect(mockPush).toHaveBeenCalledWith({ pathname: "/search/categories" });
  });

  test("'모두 지우기' 를 누르면 최근 검색어 섹션이 사라진다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await screen.findByText("최근 검색어");

    await user.press(screen.getByRole("button", { name: "모두 지우기" }));

    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
  });
});
