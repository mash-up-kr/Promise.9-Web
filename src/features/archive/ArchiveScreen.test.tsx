// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 @shared/api 를 mock 한다.
jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ArchiveScreen } from "./ArchiveScreen";

const mockGet = apiClient.get as jest.Mock;
const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));

const folderResponse = {
  data: {
    success: true,
    data: {
      systemFolders: {
        all: { linkCount: 370 },
        uncategorized: { linkCount: 12 },
        favorite: { linkCount: 0 },
        recentlyDeleted: { linkCount: 3 },
      },
      folders: [
        {
          folderId: 1,
          folderName: "디자인",
          color: "#61a8ef",
          linkCount: 5,
          lastSavedAt: null,
        },
      ],
    },
  },
};

const renderScreen = () => {
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
        <ArchiveScreen />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

describe("ArchiveScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockNavigate.mockClear();
    mockGet.mockReset();
    mockGet.mockResolvedValue(folderResponse);
  });

  test("기본 폴더/내 폴더 섹션 타이틀을 렌더한다", async () => {
    await renderScreen();
    expect(await screen.findByText("기본 폴더")).toBeOnTheScreen();
    expect(screen.getByText("내 폴더")).toBeOnTheScreen();
  });

  test("서버 응답의 기본 폴더와 사용자 폴더 항목을 렌더한다", async () => {
    await renderScreen();
    expect(await screen.findByText("전체")).toBeOnTheScreen();
    expect(screen.getByText("즐겨찾기")).toBeOnTheScreen();
    expect(screen.getByText("최근 삭제된 링크")).toBeOnTheScreen();
    expect(screen.getByText("디자인")).toBeOnTheScreen();
  });

  test("폴더를 누르면 해당 폴더 상세로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(await screen.findByText("전체"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/archive/[id]",
      params: { id: "all", name: "전체" },
    });
  });

  test("사용자 폴더를 누르면 folderId 로 상세로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(await screen.findByText("디자인"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/archive/[id]",
      params: { id: "1", name: "디자인" },
    });
  });

  test("더보기 → 폴더 정렬 편집 시 편집 모드로 전환한다", async () => {
    await renderScreen();
    await screen.findByText("디자인");
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));
    expect(screen.getByLabelText("디자인 순서 변경")).toBeOnTheScreen();
    expect(screen.getByText("완료")).toBeOnTheScreen();
  });

  test("편집 모드에서 완료를 누르면 일반 모드로 돌아온다", async () => {
    await renderScreen();
    await screen.findByText("디자인");
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));
    await fireEvent.press(screen.getByText("완료"));

    // 일반 모드 복귀: 더보기 버튼이 다시 보이고 핸들은 사라진다.
    expect(screen.getByLabelText("더보기")).toBeOnTheScreen();
    expect(screen.queryByLabelText("디자인 순서 변경")).toBeNull();
  });

  test("로딩 중에는 로딩 표시를 보여준다", async () => {
    // 응답을 보류시켜 pending 상태를 관찰한다.
    let resolveGet: (value: unknown) => void = () => {};
    mockGet.mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    );
    await renderScreen();
    expect(screen.getByTestId("archive-loading")).toBeOnTheScreen();
    // 미해결 프로미스가 열린 핸들로 남지 않도록 정리한다.
    resolveGet(folderResponse);
    await screen.findByText("전체");
  });

  test("조회 실패 시 에러 메시지와 다시 시도를 보여준다", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    await renderScreen();
    expect(
      await screen.findByText("폴더를 불러오지 못했어요."),
    ).toBeOnTheScreen();
    expect(screen.getByText("다시 시도")).toBeOnTheScreen();
  });
});
