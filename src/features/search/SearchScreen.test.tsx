import { act, render, screen, userEvent } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SEARCH_RESULT_LINKS } from "./mocks";
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

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <SearchScreen />
    </SafeAreaProvider>,
  );

const setupUser = () =>
  userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const debounce = () =>
  act(async () => {
    jest.advanceTimersByTime(300);
  });

function expectResultLinks() {
  for (const link of SEARCH_RESULT_LINKS) {
    expect(screen.getByText(link.title)).toBeOnTheScreen();
  }
}

describe("SearchScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockParamsStore.reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("최근 검색어·카테고리 둘러보기·최근 본 링크 섹션을 렌더한다", async () => {
    await renderScreen();

    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
    expect(screen.getByText("카테고리 둘러보기")).toBeOnTheScreen();
    expect(screen.getByText("최근 본 링크")).toBeOnTheScreen();
  });

  test("타이핑이 멈추고 지연시간이 지나면 자동으로 결과를 보여준다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.type(screen.getByPlaceholderText("검색"), "디자인");
    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();

    await debounce();

    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
    expectResultLinks();
  });

  test("제출하면 지연 없이 바로 결과를 보여준다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.type(screen.getByPlaceholderText("검색"), "디자인", {
      submitEditing: true,
    });

    expectResultLinks();
  });

  test("최근 검색어 칩을 누르면 해당 키워드로 즉시 검색한다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.press(screen.getByRole("button", { name: "사우나" }));

    expect(screen.getByDisplayValue("사우나")).toBeOnTheScreen();
    expectResultLinks();
  });

  test("검색어를 모두 지우면 지연 후 초기 섹션으로 돌아간다", async () => {
    const user = setupUser();
    await renderScreen();

    const input = screen.getByPlaceholderText("검색");
    await user.type(input, "디자인", { submitEditing: true });
    await user.clear(input);
    await debounce();

    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
    expect(screen.getByText("카테고리 둘러보기")).toBeOnTheScreen();
  });

  test("q 파라미터로 진입하면 결과 상태로 시작하고 인풋 값을 복원한다", async () => {
    mockParamsStore.reset({ q: "디자인" });
    await renderScreen();

    expect(screen.getByDisplayValue("디자인")).toBeOnTheScreen();
    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
    expectResultLinks();
  });

  test("'모두 지우기' 를 누르면 최근 검색어 섹션이 사라진다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.press(screen.getByRole("button", { name: "모두 지우기" }));

    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
  });

  test("카테고리 칩을 누르면 해당 카테고리의 둘러보기 화면으로 이동한다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.press(screen.getByRole("button", { name: "개발" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/search/categories",
      params: { category: "개발" },
    });
  });

  test("카테고리 둘러보기 타이틀을 누르면 둘러보기 화면으로 이동한다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.press(screen.getByRole("button", { name: "카테고리 둘러보기" }));

    expect(mockPush).toHaveBeenCalledWith({ pathname: "/search/categories" });
  });
});
