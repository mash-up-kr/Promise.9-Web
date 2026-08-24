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

  test("최근 검색어·최근 본 링크 섹션을 렌더한다", async () => {
    await renderScreen();

    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
    expect(screen.getByText("최근 본 링크")).toBeOnTheScreen();
  });

  // 시안 정책: 입력 중 실시간 조회 없음 — 검색 실행(제출·칩) 시점에만 조회한다.
  test("타이핑만으로는 검색하지 않는다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.type(screen.getByPlaceholderText("검색"), "디자인");
    await debounce();

    // 얼마를 기다려도 결과로 넘어가지 않는다.
    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
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

  test("검색어를 지우면 즉시 초기 섹션으로 돌아간다", async () => {
    const user = setupUser();
    await renderScreen();

    const input = screen.getByPlaceholderText("검색");
    await user.type(input, "디자인", { submitEditing: true });
    await user.clear(input);

    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
  });

  // Figma Filled 상태: X 탭 → 텍스트 초기화 + 기본 화면 복귀.
  test("클리어 버튼을 누르면 입력과 결과가 함께 사라진다", async () => {
    const user = setupUser();
    await renderScreen();

    await user.type(screen.getByPlaceholderText("검색"), "디자인", {
      submitEditing: true,
    });
    await user.press(screen.getByRole("button", { name: "입력 지우기" }));

    expect(screen.getByPlaceholderText("검색")).toHaveDisplayValue("");
    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
  });

  // 시안 정책: 검색 실행 시 최근 검색어에 저장된다(맨 앞, 중복 제거).
  test("검색을 실행하면 최근 검색어 맨 앞에 저장된다", async () => {
    const user = setupUser();
    await renderScreen();

    const input = screen.getByPlaceholderText("검색");
    await user.type(input, "새 검색어", { submitEditing: true });
    await user.press(screen.getByRole("button", { name: "입력 지우기" }));

    const chips = screen.getAllByRole("button", {
      name: /새 검색어|사우나|오늘의집|면접|피그마/,
    });
    expect(chips[0]).toHaveAccessibleName("새 검색어");
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
});
