jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockShareUrl = jest.fn();
jest.mock("@/utils/share", () => ({
  shareUrl: (...args: unknown[]) => mockShareUrl(...args),
}));

import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { ArchiveDetailScreen } from "./ArchiveDetailScreen";

const mockPush = jest.fn();
// 라우트 파라미터는 테스트마다 바꿀 수 있어야 한다(잘못된 id 케이스).
// 바인딩 재할당 대신 컨테이너 프로퍼티를 바꾼다 — biome useConst 가 let 을 const 로 되돌린다.
const mockRouteParams: { current: { id?: string; name?: string } } = {
  current: { id: "all", name: "전체" },
};
jest.mock("expo-router", () => ({
  // 헤더는 Stack.Screen 의 options.header 로 넘긴다 — 화면 테스트에서 헤더 동작(더보기·완료)을
  // 검증해야 하므로 목이 그 렌더 함수를 실제로 그린다.
  Stack: {
    Screen: ({ options }: { options?: { header?: () => React.ReactNode } }) =>
      options?.header?.() ?? null,
  },
  useLocalSearchParams: () => mockRouteParams.current,
  useRouter: () => ({ push: mockPush }),
}));

const mockGet = apiClient.get as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const linksResponse = (links: unknown[]) => ({
  data: {
    success: true,
    data: {
      links,
      pagination: { nextCursor: null, hasNext: false, limit: 20 },
    },
  },
});

const sampleLink = {
  linkId: 42,
  title: "피그마 파일 PSD로 변환하는 방법",
  source: "example.com",
  representativeTag: null,
  thumbnailUrl: null,
  savedAt: "2026-07-26T00:00:00.000Z",
};

const otherLink = {
  ...sampleLink,
  linkId: 43,
  title: "무조건 행복해지는 인생 치트키",
};

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // 헤더 스크롤 연동 훅이 safe-area 를 읽으므로 화면 테스트는 SafeAreaProvider 로 감싼다.
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <ArchiveDetailScreen />
        </SnackbarProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
};

// 팝오버는 iOS(테스트 환경 Platform.OS)에서 Modal 이 사라진 뒤에야 고른 동작을 실행한다.
const captureDismiss = (): (() => void) =>
  screen.getByTestId("popover-overlay").props.onDismiss;

const enterSelectMode = async () => {
  await fireEvent.press(screen.getByLabelText("더보기"));
  await fireEvent.press(screen.getByText("선택하기"));
};

describe("ArchiveDetailScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShareUrl.mockReset().mockResolvedValue("shared");
    mockGet.mockReset();
    mockGet.mockResolvedValue(linksResponse([sampleLink]));
    mockDelete.mockReset().mockResolvedValue({ data: { success: true } });
    mockRouteParams.current = { id: "all", name: "전체" };
  });

  test("폴더 id 로 /links 를 조회해 링크 타일을 렌더한다", async () => {
    await renderScreen();
    expect(await screen.findByText(sampleLink.title)).toBeOnTheScreen();
    expect(mockGet).toHaveBeenCalledWith(
      "/links",
      expect.objectContaining({
        params: { sortBy: "savedAt", order: "desc" },
      }),
    );
  });

  test("링크를 누르면 링크 상세로 이동한다", async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(sampleLink.title));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: "42" },
    });
  });

  test("링크가 없으면 빈 상태를 보여준다", async () => {
    mockGet.mockResolvedValue(linksResponse([]));
    await renderScreen();
    expect(
      await screen.findByText("아직 저장된 링크가 없어요."),
    ).toBeOnTheScreen();
  });

  test("조회 실패 시 에러와 다시 시도를 보여준다", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    await renderScreen();
    expect(
      await screen.findByText("링크를 불러오지 못했어요."),
    ).toBeOnTheScreen();
    expect(screen.getByText("다시 시도")).toBeOnTheScreen();
  });

  test("다시 시도를 누르면 재조회해 링크를 보여준다", async () => {
    mockGet
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(linksResponse([sampleLink]));
    await renderScreen();
    await fireEvent.press(await screen.findByText("다시 시도"));

    expect(await screen.findByText(sampleLink.title)).toBeOnTheScreen();
  });

  test("알 수 없는 폴더 id 면 조회하지 않고 안내를 보여준다", async () => {
    mockRouteParams.current = { id: "foo" };
    await renderScreen();
    expect(await screen.findByText("폴더를 찾을 수 없어요.")).toBeOnTheScreen();
    // NaN 파라미터로 서버를 때리지 않는다.
    expect(mockGet).not.toHaveBeenCalled();
  });

  test("id 가 없으면 조회하지 않는다", async () => {
    mockRouteParams.current = {};
    await renderScreen();
    expect(await screen.findByText("폴더를 찾을 수 없어요.")).toBeOnTheScreen();
    expect(mockGet).not.toHaveBeenCalled();
  });

  test("정렬을 오래된 순으로 바꾸면 그 순서로 다시 조회한다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);

    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("정렬"));
    await fireEvent.press(screen.getByText("오래된 순"));

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "/links",
        expect.objectContaining({
          params: { sortBy: "savedAt", order: "asc" },
        }),
      ),
    );
  });
});

describe("ArchiveDetailScreen 선택 모드", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShareUrl.mockReset().mockResolvedValue("shared");
    mockGet
      .mockReset()
      .mockResolvedValue(linksResponse([sampleLink, otherLink]));
    mockDelete.mockReset().mockResolvedValue({ data: { success: true } });
    mockRouteParams.current = { id: "7", name: "개발" };
  });

  test("선택하기를 누르면 선택 모드 헤더와 하단 액션이 나타난다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);
    await enterSelectMode();

    expect(screen.getByText("선택하기")).toBeOnTheScreen();
    expect(screen.getByLabelText("폴더 이동")).toBeOnTheScreen();
    expect(screen.getByLabelText("링크 삭제")).toBeOnTheScreen();
  });

  test("선택 모드에서 링크를 누르면 상세로 가지 않고 선택된다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);
    await enterSelectMode();
    await fireEvent.press(screen.getByLabelText(sampleLink.title));

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText("1개 선택")).toBeOnTheScreen();
  });

  test("아무것도 고르지 않으면 하단 액션을 쓸 수 없다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);
    await enterSelectMode();

    expect(
      screen.getByLabelText("폴더 이동").props.accessibilityState.disabled,
    ).toBe(true);
  });

  test("완료를 누르면 선택 모드를 끝낸다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);
    await enterSelectMode();
    await fireEvent.press(screen.getByLabelText("완료"));

    expect(screen.queryByLabelText("링크 삭제")).toBeNull();
    expect(screen.getByText("개발")).toBeOnTheScreen();
  });

  test("선택한 링크를 폴더 이동 시트로 넘긴다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);
    await enterSelectMode();
    await fireEvent.press(screen.getByLabelText(sampleLink.title));
    await fireEvent.press(screen.getByLabelText(otherLink.title));
    await fireEvent.press(screen.getByLabelText("폴더 이동"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/move-links",
      params: { ids: "42,43", folderId: "7" },
    });
  });

  test("선택한 링크를 삭제하면 확인 후 DELETE 하고 선택 모드를 끝낸다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);
    await enterSelectMode();
    await fireEvent.press(screen.getByLabelText(sampleLink.title));
    await fireEvent.press(screen.getByLabelText("링크 삭제"));

    expect(screen.getByText("링크를 삭제할까요?")).toBeOnTheScreen();
    expect(
      screen.getByText("삭제된 링크는 최근 삭제된 항목으로 이동돼요"),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText("삭제"));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("/links/42"));
    await waitFor(() =>
      expect(screen.queryByLabelText("링크 삭제")).toBeNull(),
    );
  });

  test("삭제를 취소하면 아무것도 지우지 않는다", async () => {
    await renderScreen();
    await screen.findByText(sampleLink.title);
    await enterSelectMode();
    await fireEvent.press(screen.getByLabelText(sampleLink.title));
    await fireEvent.press(screen.getByLabelText("링크 삭제"));
    await fireEvent.press(screen.getByLabelText("취소"));

    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.getByText("1개 선택")).toBeOnTheScreen();
  });
});

describe("ArchiveDetailScreen 링크 컨텍스트 메뉴", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShareUrl.mockReset().mockResolvedValue("shared");
    mockGet.mockReset().mockResolvedValue(linksResponse([sampleLink]));
    mockDelete.mockReset().mockResolvedValue({ data: { success: true } });
    mockRouteParams.current = { id: "7", name: "개발" };
  });

  const openContextMenu = async () => {
    await fireEvent(
      await screen.findByLabelText(sampleLink.title),
      "longPress",
    );
  };

  test("폴더 이동을 고르면 그 링크만 담아 시트를 연다", async () => {
    await renderScreen();
    await openContextMenu();
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText("폴더 이동"));
    await act(async () => dismiss());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/move-links",
      params: { ids: "42", folderId: "7" },
    });
  });

  test("삭제를 고르면 확인 후 DELETE 한다", async () => {
    await renderScreen();
    await openContextMenu();
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText("삭제"));
    await act(async () => dismiss());

    expect(screen.getByText("링크를 삭제할까요?")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("삭제"));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("/links/42"));
  });

  test("링크 공유를 고르면 원문 URL 을 조회해 공유한다", async () => {
    mockGet.mockImplementation((url: string) =>
      url === "/links/42"
        ? Promise.resolve({
            data: {
              success: true,
              data: { linkId: 42, url: "https://toss.tech/article/1" },
            },
          })
        : Promise.resolve(linksResponse([sampleLink])),
    );

    await renderScreen();
    await openContextMenu();
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText("링크 공유"));
    await act(async () => dismiss());

    await waitFor(() =>
      expect(mockShareUrl).toHaveBeenCalledWith("https://toss.tech/article/1"),
    );
  });

  test("공유 대신 복사됐으면 스낵바로 알린다", async () => {
    mockShareUrl.mockResolvedValue("copied");
    mockGet.mockImplementation((url: string) =>
      url === "/links/42"
        ? Promise.resolve({
            data: {
              success: true,
              data: { linkId: 42, url: "https://toss.tech/article/1" },
            },
          })
        : Promise.resolve(linksResponse([sampleLink])),
    );

    await renderScreen();
    await openContextMenu();
    const dismiss = captureDismiss();
    await fireEvent.press(screen.getByText("링크 공유"));
    await act(async () => dismiss());

    expect(
      await screen.findByText("링크 주소를 복사했어요."),
    ).toBeOnTheScreen();
  });
});
