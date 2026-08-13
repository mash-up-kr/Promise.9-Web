const mockRouterNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: mockRouterNavigate }),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import {
  TabBar,
  plusButtonStyles,
  tabBarStyles,
  tabIconStyles,
  tabItemStyles,
} from "./TabBar";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderWithSafeArea = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);

const emit = jest.fn(() => ({ defaultPrevented: false }));
const navigate = jest.fn();

function makeProps(activeIndex = 0) {
  return {
    state: {
      index: activeIndex,
      routes: [
        { key: "index-1", name: "index" },
        { key: "search-1", name: "search" },
        { key: "archive-1", name: "archive" },
        { key: "settings-1", name: "settings" },
      ],
    },
    navigation: { emit, navigate },
  } as unknown as BottomTabBarProps;
}

describe("TabBar", () => {
  beforeEach(() => {
    emit.mockClear();
    navigate.mockClear();
    mockRouterNavigate.mockClear();
  });

  test("홈·보관함 탭과 링크 추가 버튼을 렌더한다", async () => {
    await renderWithSafeArea(<TabBar {...makeProps()} />);
    expect(screen.getByRole("tab", { name: "홈" })).toBeOnTheScreen();
    expect(screen.getByRole("tab", { name: "보관함" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "링크 추가" })).toBeOnTheScreen();
  });

  test("검색·세팅 라우트는 탭바에 노출하지 않는다", async () => {
    await renderWithSafeArea(<TabBar {...makeProps()} />);
    expect(screen.queryByRole("tab", { name: "검색" })).not.toBeOnTheScreen();
    expect(screen.queryByRole("tab", { name: "세팅" })).not.toBeOnTheScreen();
  });

  test("현재 라우트의 탭이 selected 상태다", async () => {
    await renderWithSafeArea(<TabBar {...makeProps(0)} />);
    expect(screen.getByRole("tab", { name: "홈" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "보관함" })).not.toBeSelected();
  });

  test("비활성 탭을 누르면 해당 라우트로 이동한다", async () => {
    await renderWithSafeArea(<TabBar {...makeProps(0)} />);
    fireEvent.press(screen.getByRole("tab", { name: "보관함" }));
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tabPress", target: "archive-1" }),
    );
    expect(navigate).toHaveBeenCalledWith("archive", undefined);
  });

  test("이미 활성인 탭을 누르면 이동하지 않는다", async () => {
    await renderWithSafeArea(<TabBar {...makeProps(0)} />);
    fireEvent.press(screen.getByRole("tab", { name: "홈" }));
    expect(navigate).not.toHaveBeenCalled();
  });

  test("+ 버튼은 navigate 로 이동한다 — 연타해도 시트가 중복 push 되지 않게", async () => {
    await renderWithSafeArea(<TabBar {...makeProps()} />);
    fireEvent.press(screen.getByRole("button", { name: "링크 추가" }));
    expect(mockRouterNavigate).toHaveBeenCalledWith("/create-link");
  });
});

// jest 는 className 을 해석하지 않으므로 tv 매핑을 직접 단언한다(expo-pitfalls).
describe("TabBar 시안 스타일", () => {
  test("컨테이너는 gray-700 솔리드 pill(h60·px16·gap12)이다", () => {
    const cls = tabBarStyles();
    expect(cls).toContain("bg-gray-700");
    expect(cls).toContain("h-15");
    expect(cls).toContain("px-4");
    expect(cls).toContain("gap-3");
  });

  test("탭 아이템은 44 원형이고 선택돼도 배경 스왑이 없다", () => {
    const cls = tabItemStyles();
    expect(cls).toContain("size-11");
    expect(cls).not.toContain("bg-");
  });

  test("탭 아이콘은 선택=accent, 비선택=assistive 채움이다", () => {
    expect(tabIconStyles({ isActive: true })).toContain("text-icon-accent");
    expect(tabIconStyles({ isActive: false })).toContain(
      "text-icon-assistive",
    );
  });

  test("링크 추가 버튼은 40 원형 gray-500 이다", () => {
    const cls = plusButtonStyles();
    expect(cls).toContain("size-10");
    expect(cls).toContain("bg-gray-500");
    expect(cls).toContain("rounded-full");
  });

  test("링크 추가 버튼은 누르는 동안 gray-400 으로 스왑한다(IconButton 인터랙션)", () => {
    const cls = plusButtonStyles({ isPressed: true });
    expect(cls).toContain("bg-gray-400");
    expect(cls).not.toContain("bg-gray-500");
  });
});
