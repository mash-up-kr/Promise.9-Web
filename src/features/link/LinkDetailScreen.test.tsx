import { render, screen, userEvent } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { LinkDetailScreen } from "./LinkDetailScreen";
import { mockLinkDetail, mockRelatedLinks } from "./mock/mockLinkDetail";

// Stack.Screen 은 헤더를 options.header 로만 받으므로, 기본 목이면 헤더가 렌더되지 않는다.
// 즐겨찾기 버튼이 헤더에 있어 검증하려면 header 를 실제로 렌더해야 한다.
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options?: { header?: () => React.ReactNode } }) =>
      options?.header?.() ?? null,
  },
  useLocalSearchParams: () => ({ id: String(mockLinkDetail.linkId) }),
  // 헤더의 HeaderBackButton 이 사용한다.
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  canGoBack: () => true,
}));

// 헤더가 useSafeAreaInsets 를 쓰므로 Provider 가 필요하다 (Header.test.tsx 와 동일한 패턴).
const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <LinkDetailScreen />
    </SafeAreaProvider>,
  );

describe("LinkDetailScreen", () => {
  test("제목·폴더·출처/저장일을 렌더한다", async () => {
    await renderScreen();
    expect(screen.getByText(mockLinkDetail.title)).toBeOnTheScreen();
    expect(screen.getByText("디자인")).toBeOnTheScreen();
    expect(screen.getByText("toss.tech · 2026.06.19")).toBeOnTheScreen();
  });

  test("AI 요약 섹션을 렌더한다", async () => {
    await renderScreen();
    expect(screen.getByText("AI 요약으로 미리보기")).toBeOnTheScreen();
  });

  test("태그 추가 → 화면에 새 태그 칩이 반영된다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.type(
      screen.getByPlaceholderText("태그를 입력해 주세요"),
      "회고",
    );
    await user.press(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("#회고")).toBeOnTheScreen();
  });

  test("태그 삭제 → 화면에서 해당 칩이 사라진다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.press(screen.getByLabelText("IT 삭제"));
    expect(screen.queryByText("#IT")).toBeNull();
  });

  test("메모 입력값이 controlled state로 반영된다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    const input = screen.getByPlaceholderText(
      "저장한 이유나 기억하고 싶은 점을 적어보세요",
    );
    await user.type(input, "!");
    expect(input.props.value).toBe(`${mockLinkDetail.memo}!`);
  });

  test("즐겨찾기 탭 → 선택 상태가 토글된다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    const favoriteButton = () =>
      screen.getByRole("button", { name: "즐겨찾기" });

    // mock 은 isFavorite: false 로 시작
    expect(favoriteButton().props.accessibilityState.selected).toBe(false);

    await user.press(favoriteButton());
    expect(favoriteButton().props.accessibilityState.selected).toBe(true);

    await user.press(favoriteButton());
    expect(favoriteButton().props.accessibilityState.selected).toBe(false);
  });

  test("함께 다시 볼 링크 섹션에 mock 아이템이 렌더된다", async () => {
    await renderScreen();
    expect(screen.getByText("함께 다시 볼 링크")).toBeOnTheScreen();
    for (const item of mockRelatedLinks) {
      expect(screen.getByText(item.title)).toBeOnTheScreen();
    }
  });
});
