import { render, screen, userEvent } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";
import * as share from "@/utils/share";

import { LinkDetailScreen } from "./LinkDetailScreen";
import {
  mockLinkDetail,
  mockLinkDetailUnclassified,
  mockRelatedLinks,
} from "./mock/mockLinkDetail";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockDelete = jest.fn().mockResolvedValue(undefined);
// 라우트 id — 테스트별로 미분류(101) 등으로 바꿔 넣는다(mock 접두사라 jest.mock 팩토리에서 참조 가능).
const mockRoute = { id: String(mockLinkDetail.linkId) };

// Stack.Screen 은 헤더를 options.header 로만 받으므로, 기본 목이면 헤더가 렌더되지 않는다.
// 즐겨찾기 버튼이 헤더에 있어 검증하려면 header 를 실제로 렌더해야 한다.
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: { options?: { header?: () => React.ReactNode } }) =>
      options?.header?.() ?? null,
  },
  useLocalSearchParams: () => ({ id: mockRoute.id }),
  // 헤더의 HeaderBackButton 이 사용한다.
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
  canGoBack: () => true,
}));

jest.mock("@/utils/share", () => ({ shareUrl: jest.fn() }));
jest.mock("@/entities/link/link.queries", () => ({
  useDeleteLinkMutation: () => ({ mutateAsync: mockDelete }),
}));
jest.mock("./components/LinkMoreMenu", () => {
  const { Pressable, Text } = require("react-native");
  return {
    LinkMoreMenu: ({
      onMove,
      onShare,
      onDelete,
    }: {
      onMove: () => void;
      onShare: () => void;
      onDelete: () => void;
    }) => (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="mock-move"
          onPress={onMove}
        >
          <Text>move</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="mock-share"
          onPress={onShare}
        >
          <Text>share</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="mock-delete"
          onPress={onDelete}
        >
          <Text>delete</Text>
        </Pressable>
      </>
    ),
  };
});

// 헤더가 useSafeAreaInsets 를 쓰므로 Provider 가 필요하다 (Header.test.tsx 와 동일한 패턴).
const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <SnackbarProvider>
        <LinkDetailScreen />
      </SnackbarProvider>
    </SafeAreaProvider>,
  );

describe("LinkDetailScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    mockDelete.mockClear();
    (share.shareUrl as jest.Mock).mockResolvedValue("copied");
    mockRoute.id = String(mockLinkDetail.linkId);
  });

  test("지정 폴더 칩을 누르면 해당 폴더 상세로 이동한다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByRole("button", { name: "디자인 폴더 열기" }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/archive/[id]",
        params: expect.objectContaining({
          id: String(mockLinkDetail.folder?.folderId),
        }),
      }),
    );
  });

  test("미분류에서 '폴더선택'을 누르면 폴더 선택 시트로 이동한다", async () => {
    mockRoute.id = String(mockLinkDetailUnclassified.linkId);
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByText("폴더선택"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/move-links",
        params: expect.objectContaining({ title: "폴더 선택" }),
      }),
    );
  });

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

  test("링크 공유 → shareUrl 을 호출하고, 복사면 토스트를 띄운다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText("mock-share"));
    expect(share.shareUrl).toHaveBeenCalledWith(mockLinkDetail.url);
    expect(await screen.findByText("링크가 복사됐어요")).toBeOnTheScreen();
  });

  test("폴더 이동 → move-links 라우트로 이동한다", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.press(screen.getByLabelText("mock-move"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/move-links" }),
    );
  });

  test("삭제 → 다이얼로그 확인 시 삭제 후 뒤로 간다", async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByLabelText("mock-delete"));
    expect(screen.getByText("링크를 삭제할까요?")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "삭제" }));
    expect(mockDelete).toHaveBeenCalledWith(mockLinkDetail.linkId);
    await screen.findByText(mockLinkDetail.title); // 리렌더 안정화
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
