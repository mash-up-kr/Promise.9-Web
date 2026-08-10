jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import { apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { ArchiveDetailScreen } from "./ArchiveDetailScreen";

const mockPush = jest.fn();
// 라우트 파라미터는 테스트마다 바꿀 수 있어야 한다(잘못된 id 케이스).
// 바인딩 재할당 대신 컨테이너 프로퍼티를 바꾼다 — biome useConst 가 let 을 const 로 되돌린다.
const mockRouteParams: { current: { id?: string; name?: string } } = {
  current: { id: "all", name: "전체" },
};
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockRouteParams.current,
  useRouter: () => ({ push: mockPush }),
}));

const mockGet = apiClient.get as jest.Mock;

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

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ArchiveDetailScreen />
    </QueryClientProvider>,
  );
};

describe("ArchiveDetailScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGet.mockReset();
    mockGet.mockResolvedValue(linksResponse([sampleLink]));
    mockRouteParams.current = { id: "all", name: "전체" };
  });

  test("폴더 id 로 /links 를 조회해 링크 타일을 렌더한다", async () => {
    await renderScreen();
    expect(await screen.findByText(sampleLink.title)).toBeOnTheScreen();
    expect(mockGet).toHaveBeenCalledWith(
      "/links",
      expect.objectContaining({
        params: {},
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
});
