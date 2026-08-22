// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 @shared/api 를 mock 한다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return { apiClient: { get: jest.fn() }, ...errors };
});

import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { HomeScreen } from "./HomeScreen";

const mockGet = apiClient.get as jest.Mock;
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const link = (linkId: number, title: string) => ({
  linkId,
  title,
  source: "example.com",
  representativeTag: null,
  thumbnailUrl: null,
  savedAt: "2026-08-10T00:00:00.000Z",
});

const linkListData = (links: ReturnType<typeof link>[]) => ({
  data: {
    success: true,
    data: {
      links,
      pagination: { nextCursor: null, hasNext: false, limit: 9 },
    },
  },
});

const folderListData = {
  data: {
    success: true,
    data: {
      systemFolders: {
        all: { linkCount: 3 },
        uncategorized: { linkCount: 0 },
        favorite: { linkCount: 0 },
        recentlyDeleted: { linkCount: 0 },
      },
      folders: [
        {
          folderId: 1,
          folderName: "매쉬업 활동",
          color: "#61a8ef",
          linkCount: 5,
          lastSavedAt: "2026-08-01T00:00:00.000Z",
        },
        {
          folderId: 2,
          folderName: "취업",
          color: "#61a8ef",
          linkCount: 2,
          lastSavedAt: "2026-08-10T00:00:00.000Z",
        },
        {
          folderId: 3,
          folderName: "대구 여행",
          color: "#61a8ef",
          linkCount: 1,
          lastSavedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    },
  },
};

const renderScreen = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // RNTL 14 의 render 는 async 라 여기서 기다려야 호출부의 await 가 실제 렌더를 기다린다.
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 375, height: 812 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <SnackbarProvider>
          <HomeScreen />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
};

describe("HomeScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGet.mockReset();
    mockGet.mockImplementation(
      async (url: string, config?: { params?: { folderId?: number } }) => {
        if (url === "/folders") return folderListData;

        const folderId = config?.params?.folderId;
        if (folderId === undefined) {
          return linkListData([link(10, "최근 저장한 링크")]);
        }
        return linkListData([link(folderId, `폴더 ${folderId} 링크`)]);
      },
    );
  });

  test("최근 저장과 자주 보는 폴더 섹션 타이틀을 보여준다", async () => {
    await renderScreen();

    expect(await screen.findByText("최근 저장")).toBeOnTheScreen();
    expect(screen.getByText("자주 보는 폴더")).toBeOnTheScreen();
  });

  test("서버에서 받은 최근 저장 링크를 보여준다", async () => {
    await renderScreen();

    expect(await screen.findByText("최근 저장한 링크")).toBeOnTheScreen();
  });

  // 시안 정책: 저장된 링크가 하나도 없으면 헤더만 남기고 화면 전체를 대체한다.
  test("링크가 하나도 없으면 전체 빈 상태를 보여준다", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/folders") return folderListData;
      return linkListData([]);
    });

    await renderScreen();

    expect(
      await screen.findByText("아직 저장된 링크가 없어요"),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("링크를 저장하고 한곳에서 모아보세요"),
    ).toBeOnTheScreen();
    expect(screen.queryByText("최근 저장")).not.toBeOnTheScreen();
  });

  // 시안 정책: 폴더 0개는 화면 전체가 아니라 자주 보는 폴더 자리만 대체한다.
  test("폴더가 없으면 그 섹션 자리에만 빈 상태와 새 폴더 만들기를 보여준다", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url === "/folders") {
        return {
          data: {
            success: true,
            data: { ...folderListData.data.data, folders: [] },
          },
        };
      }
      return linkListData([link(10, "최근 저장한 링크")]);
    });

    await renderScreen();

    expect(await screen.findByText("아직 폴더가 없어요")).toBeOnTheScreen();
    expect(
      screen.getByText("폴더를 만들고 링크를 정리해보세요"),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "새 폴더 만들기" }),
    ).toBeOnTheScreen();
    // 최근 저장은 그대로 남는다.
    expect(screen.getByText("최근 저장")).toBeOnTheScreen();
  });

  test("조회에 실패하면 에러 화면과 다시 불러오기를 보여준다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error("network"));

    await renderScreen();

    expect(
      await screen.findByText("일시적인 오류가 발생했어요"),
    ).toBeOnTheScreen();
    expect(screen.getByText("잠시 후 다시 시도해주세요")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "다시 불러오기" }),
    ).toBeOnTheScreen();
    spy.mockRestore();
  });

  test("다시 볼 링크와 많이 저장한 키워드 섹션을 보여준다", async () => {
    await renderScreen();

    expect(await screen.findByText("다시 볼 링크")).toBeOnTheScreen();
    expect(screen.getByText("많이 저장한 키워드")).toBeOnTheScreen();
  });

  // 시안 정책: 자주 보는 폴더는 최대 2개.
  test("자주 보는 상위 2개 폴더와 각 폴더의 링크만 보여준다", async () => {
    await renderScreen();

    expect(await screen.findByText("취업")).toBeOnTheScreen();
    expect(screen.getByText("매쉬업 활동")).toBeOnTheScreen();
    expect(screen.queryByText("대구 여행")).not.toBeOnTheScreen();

    expect(screen.getByText("폴더 2 링크")).toBeOnTheScreen();
    expect(screen.getByText("폴더 1 링크")).toBeOnTheScreen();
  });

  const pullToRefresh = async () => {
    const scrollView = screen.getByTestId("home-scroll");
    await act(async () => {
      await scrollView.props.refreshControl.props.onRefresh();
    });
  };

  // 투명 헤더 아래에서 스피너가 가려지지 않도록 헤더 높이만큼 내려 잡는다.
  test("새로고침 스피너를 헤더 높이만큼 내린다", async () => {
    await renderScreen();
    await screen.findByText("최근 저장");

    const { progressViewOffset } =
      screen.getByTestId("home-scroll").props.refreshControl.props;

    expect(progressViewOffset).toBeGreaterThan(0);
  });

  test("당겨서 새로고침하면 전 섹션을 다시 불러온다", async () => {
    await renderScreen();
    await screen.findByText("최근 저장");
    const callsBeforeRefresh = mockGet.mock.calls.length;

    await pullToRefresh();

    expect(mockGet.mock.calls.length).toBeGreaterThan(callsBeforeRefresh);
  });

  // 당겨서 새로고침하지 않아도(화면 재진입 등 자동 재조회) 실패는 알려야 한다.
  test("자동 재조회가 실패해도 화면을 유지하고 스낵바로 알린다", async () => {
    const { queryClient } = await renderScreen();
    await screen.findByText("최근 저장");
    mockGet.mockRejectedValue(new Error("network"));

    await act(async () => {
      await queryClient.refetchQueries();
    });

    expect(
      await screen.findByText("오프라인 상태예요. 연결 후 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(screen.getByText("최근 저장")).toBeOnTheScreen();
  });

  // 시안 정책: 캐시가 있으면 화면을 그대로 두고 스낵바로만 알린다.
  test("새로고침이 실패하면 화면을 유지하고 스낵바로 알린다", async () => {
    await renderScreen();
    await screen.findByText("최근 저장");
    mockGet.mockRejectedValue(new Error("network"));

    await pullToRefresh();

    expect(
      await screen.findByText("오프라인 상태예요. 연결 후 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(screen.getByText("최근 저장")).toBeOnTheScreen();
  });
});
