// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 @shared/api 를 mock 한다.
jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
  getRefreshToken: jest.fn(() => Promise.resolve(null)),
  clearTokens: jest.fn(),
}));

// 버전 표시는 app.json version 에서 온다 — 테스트에선 고정한다.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" } },
}));

import type { AnalyticsRuntime } from "@shared/analytics/analytics.runtime";
import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnalyticsContext } from "@/components/analytics/AnalyticsContext";

import { SettingsScreen } from "./SettingsScreen";

const mockGet = apiClient.get as jest.Mock;
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    canGoBack: () => true,
    back: jest.fn(),
  }),
}));

const profileResponse = {
  data: {
    success: true,
    data: { userId: 1, email: "master@promise.local", provider: "unknown" },
  },
};

const renderScreen = (runtime: AnalyticsRuntime | null = null) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <AnalyticsContext value={{ runtime, screen: null, screenKey: "" }}>
          <SettingsScreen />
        </AnalyticsContext>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("SettingsScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockGet.mockReset();
    mockGet.mockResolvedValue(profileResponse);
  });

  test("계정/서비스 섹션과 행들을 렌더한다", async () => {
    await renderScreen();
    expect(screen.getByText("계정")).toBeOnTheScreen();
    expect(screen.getByText("서비스")).toBeOnTheScreen();
    expect(screen.getByText("이메일")).toBeOnTheScreen();
    expect(screen.getByText("로그아웃")).toBeOnTheScreen();
    expect(screen.getByText("회원 탈퇴")).toBeOnTheScreen();
    expect(screen.getByText("서비스 이용약관")).toBeOnTheScreen();
    expect(screen.getByText("개인정보처리방침")).toBeOnTheScreen();
    expect(screen.getByText("버전 정보")).toBeOnTheScreen();
  });

  test("스크롤 끝은 플로팅 탭바(safe-area 34 + 바 60) 위로 36 을 남긴다", async () => {
    await renderScreen();
    expect(screen.getByTestId("settings-scroll-content")).toHaveStyle({
      paddingBottom: 130,
    });
  });

  test("이메일을 조회해 표시한다", async () => {
    await renderScreen();
    expect(await screen.findByText("master@promise.local")).toBeOnTheScreen();
    expect(mockGet).toHaveBeenCalledWith("/users/me", expect.anything());
  });

  test("이메일 로딩 중에는 스켈레톤을 보여준다", async () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    await renderScreen();
    const skeleton = await screen.findByTestId("email-skeleton");
    expect(skeleton).toBeOnTheScreen();
    // 리스트 행(gray-800) 위라 기본 블록 색으로는 보이지 않는다.
    expect(skeleton.props.className).toContain("bg-background-list-selected");
  });

  test("이메일 조회 실패 시 '-' 를 보여준다", async () => {
    mockGet.mockRejectedValue(new Error("실패"));
    await renderScreen();
    expect(await screen.findByText("-")).toBeOnTheScreen();
  });

  test("버전 정보를 v{version} 으로 표시한다", async () => {
    await renderScreen();
    expect(screen.getByText("v1.0.0")).toBeOnTheScreen();
  });

  test("회원 탈퇴를 누르면 탈퇴 화면으로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("회원 탈퇴"));
    expect(mockPush).toHaveBeenCalledWith("/settings/withdraw");
  });

  test("서비스 이용약관을 누르면 약관 화면으로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("서비스 이용약관"));
    expect(mockPush).toHaveBeenCalledWith("/settings/terms");
  });

  test("개인정보처리방침을 누르면 개인정보 화면으로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("개인정보처리방침"));
    expect(mockPush).toHaveBeenCalledWith("/settings/privacy");
  });

  test("로그아웃을 누르면 확인 다이얼로그가 열린다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("로그아웃"));
    expect(await screen.findByText("로그아웃 하시겠어요?")).toBeOnTheScreen();
  });

  test("다이얼로그에서 취소하면 닫힌다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("로그아웃"));
    await screen.findByText("로그아웃 하시겠어요?");
    fireEvent.press(screen.getByText("취소"));
    await waitFor(() =>
      expect(screen.queryByText("로그아웃 하시겠어요?")).not.toBeOnTheScreen(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("다이얼로그에서 로그아웃을 확정하면 로그인 화면으로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("로그아웃"));
    await screen.findByText("로그아웃 하시겠어요?");
    // 행 라벨과 다이얼로그 버튼 둘 다 "로그아웃" — 다이얼로그 버튼(나중 렌더)을 누른다.
    const logoutTexts = screen.getAllByText("로그아웃");
    fireEvent.press(logoutTexts[logoutTexts.length - 1]);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login"),
    );
  });

  describe("이용 통계 수집 토글", () => {
    const fakeRuntime = (isCollecting: boolean) => {
      const client = { isCollecting };
      const listeners = new Set<() => void>();
      const setCollecting = jest.fn((value: boolean) => {
        client.isCollecting = value;
      });
      const runtime = {
        ready: Promise.resolve(),
        client,
        setCollecting,
        subscribeCollecting: (listener: () => void) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      } as unknown as AnalyticsRuntime;
      const changeElsewhere = (value: boolean) => {
        client.isCollecting = value;
        for (const listener of listeners) listener();
      };
      return { runtime, setCollecting, changeElsewhere };
    };

    test("수집이 꺼진 빌드에서는 토글을 보여 주지 않는다", async () => {
      await renderScreen(null);
      expect(screen.queryByText("이용 통계 수집")).toBeNull();
    });

    test("저장된 상태를 보여 주고, 누르면 수집을 끈다", async () => {
      const { runtime, setCollecting } = fakeRuntime(true);
      await renderScreen(runtime);
      const toggle = await screen.findByRole("switch", {
        name: "이용 통계 수집",
      });
      expect(toggle).toBeChecked();
      await userEvent.setup().press(toggle);
      expect(setCollecting).toHaveBeenCalledWith(false);
      expect(toggle).not.toBeChecked();
    });

    test("다른 탭에서 설정이 바뀌면 토글 표시도 따라 바뀐다", async () => {
      const { runtime, changeElsewhere } = fakeRuntime(false);
      await renderScreen(runtime);
      const toggle = await screen.findByRole("switch", {
        name: "이용 통계 수집",
      });
      expect(toggle).not.toBeChecked();
      await act(() => changeElsewhere(true));
      expect(toggle).toBeChecked();
    });
  });
});
