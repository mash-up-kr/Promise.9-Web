import { render, screen, userEvent } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SEARCH_RESULT_LINKS } from "./mocks";
import { SearchScreen } from "./SearchScreen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  // 검색 인풋이 헤더에 있어, 헤더를 실제로 렌더해 통합 검증한다.
  Stack: {
    Screen: ({ options }: { options?: { header?: () => React.ReactNode } }) =>
      options?.header ? options.header() : null,
  },
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

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

describe("SearchScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test("최근 검색어·카테고리 둘러보기·최근 본 링크 섹션을 렌더한다", async () => {
    await renderScreen();

    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
    expect(screen.getByText("카테고리 둘러보기")).toBeOnTheScreen();
    expect(screen.getByText("최근 본 링크")).toBeOnTheScreen();
  });

  test("'모두 지우기' 를 누르면 최근 검색어 섹션이 사라진다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "모두 지우기" }));

    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
  });

  test("카테고리 칩을 누르면 해당 카테고리의 둘러보기 화면으로 이동한다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "개발" }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/search/categories",
      params: { category: "개발" },
    });
  });

  test("카테고리 둘러보기 타이틀을 누르면 둘러보기 화면으로 이동한다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "카테고리 둘러보기" }));

    expect(mockPush).toHaveBeenCalledWith({ pathname: "/search/categories" });
  });

  test("검색어를 제출하면 초기 섹션 대신 결과 그리드를 보여준다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("검색"), "디자인", {
      submitEditing: true,
    });

    expect(screen.queryByText("최근 검색어")).not.toBeOnTheScreen();
    expect(screen.queryByText("카테고리 둘러보기")).not.toBeOnTheScreen();
    for (const link of SEARCH_RESULT_LINKS) {
      expect(screen.getByText(link.title)).toBeOnTheScreen();
    }
  });

  test("최근 검색어 칩을 누르면 해당 키워드로 검색을 실행한다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "사우나" }));

    expect(screen.getByDisplayValue("사우나")).toBeOnTheScreen();
    for (const link of SEARCH_RESULT_LINKS) {
      expect(screen.getByText(link.title)).toBeOnTheScreen();
    }
  });

  test("검색어를 모두 지우면 초기 섹션으로 돌아간다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText("검색");
    await user.type(input, "디자인", { submitEditing: true });
    await user.clear(input);

    expect(screen.getByText("최근 검색어")).toBeOnTheScreen();
    expect(screen.getByText("카테고리 둘러보기")).toBeOnTheScreen();
  });
});
