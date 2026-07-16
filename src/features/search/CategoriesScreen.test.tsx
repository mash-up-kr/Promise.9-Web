import { render, screen, userEvent } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { CategoriesScreen } from "./CategoriesScreen";
import { CATEGORY_LINKS } from "./mocks";

const mockNavigate = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  // 검색 아이콘이 헤더에 있어, 헤더를 실제로 렌더해 통합 검증한다.
  Stack: {
    Screen: ({ options }: { options?: { header?: () => React.ReactNode } }) =>
      options?.header ? options.header() : null,
  },
  useRouter: () => ({ navigate: mockNavigate, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CategoriesScreen />
    </SafeAreaProvider>,
  );

describe("CategoriesScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockParams = {};
  });

  test("파라미터가 없으면 '전체' 탭이 선택되고 모든 링크를 보여준다", async () => {
    await renderScreen();

    expect(screen.getByRole("button", { name: "전체" })).toBeSelected();
    for (const link of CATEGORY_LINKS) {
      expect(screen.getByText(link.title)).toBeOnTheScreen();
    }
  });

  test("category 파라미터로 진입하면 해당 탭이 선택된다", async () => {
    mockParams = { category: "디자인" };
    await renderScreen();

    expect(screen.getByRole("button", { name: "디자인" })).toBeSelected();
  });

  test("탭을 누르면 해당 카테고리의 링크만 보여준다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "디자인" }));

    const designLinks = CATEGORY_LINKS.filter(
      (link) => link.representativeTag?.name === "디자인",
    );
    const otherLinks = CATEGORY_LINKS.filter(
      (link) => link.representativeTag?.name !== "디자인",
    );
    for (const link of designLinks) {
      expect(screen.getByText(link.title)).toBeOnTheScreen();
    }
    for (const link of otherLinks) {
      expect(screen.queryByText(link.title)).not.toBeOnTheScreen();
    }
  });

  test("헤더 검색 아이콘을 누르면 검색 화면으로 이동한다", async () => {
    await renderScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "검색" }));

    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });
});
