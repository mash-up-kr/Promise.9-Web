import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    push: mockPush,
    canGoBack: mockCanGoBack,
  }),
}));
jest.mock("expo-clipboard", () => ({
  hasStringAsync: jest.fn().mockResolvedValue(false),
  getStringAsync: jest.fn().mockResolvedValue(""),
}));
// ReminderSection → reminder.permissions → expo-notifications.
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "undetermined" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));
// LinkPreviewCard·FolderChipList 가 각각 useLinkPreview·useSuspenseQuery(folderQueries.list())
// 로 apiClient 를 쓴다 — client.ts(env 필수) 로드를 피해 apiClient 만 목한다.
jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { apiClient } from "@shared/api";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { CreateLinkSheet } from "./CreateLinkSheet";

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

const FOLDERS_RESPONSE = {
  systemFolders: {
    all: { linkCount: 3 },
    uncategorized: { linkCount: 1 },
    favorite: { linkCount: 0 },
    recentlyDeleted: { linkCount: 0 },
  },
  folders: [
    {
      folderId: 1,
      folderName: "디자인",
      color: "#d5d76a",
      linkCount: 2,
      lastSavedAt: null,
    },
    {
      folderId: 2,
      folderName: "개발",
      color: "#6a9fd7",
      linkCount: 1,
      lastSavedAt: null,
    },
  ],
};

const PREVIEW_RESPONSE = {
  title: "기본",
  source: "example.com",
  thumbnailUrl: null,
};

// apiClient.get 은 FolderChipList("/folders")·LinkPreviewCard("/links/preview") 가 함께 쓴다 —
// 첫 인자(url)로 분기해야 두 훅이 서로의 응답을 가로채지 않는다.
function mockGetByUrl(
  overrides: Partial<Record<"/folders" | "/links/preview", unknown>> = {},
) {
  mockGet.mockImplementation((url: string) => {
    if (url === "/folders") {
      return Promise.resolve({
        data: {
          success: true,
          data: overrides["/folders"] ?? FOLDERS_RESPONSE,
        },
      });
    }
    if (url === "/links/preview") {
      return Promise.resolve({
        data: {
          success: true,
          data: overrides["/links/preview"] ?? PREVIEW_RESPONSE,
        },
      });
    }
    return Promise.reject(new Error(`unhandled GET ${url}`));
  });
}

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// renderSheet 은 render() 결과를 그대로 반환한다 — 이 스택(RNTL14 · test-renderer 1.2.0 · React19)에서
// 결과를 버리고 다른 값을 반환하면 전역 screen 바인딩이 깨진다. 무효화 검증은 QueryClient.prototype 스파이로.
// SnackbarProvider 는 useSafeAreaInsets 를 쓰므로 SafeAreaProvider 안에 둔다.
const renderSheet = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SafeAreaProvider initialMetrics={metrics}>
        <SnackbarProvider>
          <CreateLinkSheet />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );

async function fillValidUrl(url = "https://example.com") {
  await fireEvent.changeText(screen.getByPlaceholderText("URL"), url);
  await waitFor(() =>
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(false),
  );
}

async function pressSave() {
  const user = userEvent.setup();
  await user.press(screen.getByLabelText("저장"));
}

describe("CreateLinkSheet", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockPush.mockClear();
    mockCanGoBack.mockClear();
    mockCanGoBack.mockReturnValue(true);
    mockGet.mockReset();
    mockGetByUrl();
    mockPost.mockReset();
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          linkId: 1,
          url: "https://example.com",
          savedAt: "2026-07-17T00:00:00.000Z",
        },
      },
    });
  });

  test("URL 이 비어 있으면 저장 비활성, 입력하면(형식 무관) 활성", async () => {
    await renderSheet();
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(true);

    // 시안 정책: 형식 무관 — "abc" 입력만으로 활성화된다.
    await fireEvent.changeText(screen.getByPlaceholderText("URL"), "abc");
    await waitFor(() =>
      expect(
        screen.getByLabelText("저장").props.accessibilityState.disabled,
      ).toBe(false),
    );
  });

  test("저장 성공 → payload 에 folderId·reminderAt 포함, 성공 스낵바 + 닫힘", async () => {
    await renderSheet();
    await fillValidUrl();

    const user = userEvent.setup();
    await user.press(await screen.findByText("디자인"));
    await user.press(screen.getByRole("switch"));

    await pressSave();

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/links", {
        url: "https://example.com",
        folderId: 1,
        memo: null,
        reminderAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{2}:\d{2}$/,
        ),
      }),
    );
    expect(await screen.findByText("링크를 저장했어요")).toBeTruthy();
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  test("성공 스낵바의 '보기'를 누르면 링크 상세로 이동한다", async () => {
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    const user = userEvent.setup();
    await user.press(await screen.findByText("보기"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/link/[id]",
      params: { id: "1" },
    });
  });

  test("리마인드 미설정 시 reminderAt: null", async () => {
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/links", {
        url: "https://example.com",
        folderId: null,
        memo: null,
        reminderAt: null,
      }),
    );
  });

  test("메모는 앞뒤 공백을 제거해 전송한다", async () => {
    await renderSheet();
    await fillValidUrl();
    await fireEvent.changeText(
      screen.getByPlaceholderText(
        "저장한 이유나 기억하고 싶은 점을 적어보세요",
      ),
      "  기억할 것  ",
    );
    await pressSave();

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/links", {
        url: "https://example.com",
        folderId: null,
        memo: "기억할 것",
        reminderAt: null,
      }),
    );
  });

  test("저장 성공 시 링크·폴더 쿼리를 무효화한다", async () => {
    const invalidateSpy = jest.spyOn(
      QueryClient.prototype,
      "invalidateQueries",
    );
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["link"] }),
    );
    // 폴더 칩의 링크 카운트도 저장 직후 갱신돼야 한다.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["folder"] });
    invalidateSpy.mockRestore();
  });

  test("형식이 잘못된 URL 저장 시도 → 서버 호출 없이 실패 스낵바, 시트 유지", async () => {
    await renderSheet();
    await fillValidUrl("abc");
    await pressSave();

    expect(await screen.findByText("저장하지 못했어요")).toBeTruthy();
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("URL").props.value).toBe("abc");
  });

  test("저장 실패(500) → 실패 스낵바 + 입력 보존, '다시 시도'가 저장을 재실행한다", async () => {
    mockPost.mockRejectedValueOnce(new Error("500"));
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    expect(await screen.findByText("저장하지 못했어요")).toBeTruthy();
    expect(screen.getByText("다시 시도")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("URL").props.value).toBe(
      "https://example.com",
    );

    const user = userEvent.setup();
    await user.press(screen.getByText("다시 시도"));

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  test("중복(errorCode 930003) → 중복 스낵바, 시트 유지, linkId 없으면(구버전 응답) '보기' 없음", async () => {
    const { ApiError } = jest.requireActual("@shared/api/errors");
    mockPost.mockRejectedValueOnce(
      new ApiError({
        status: 409,
        data: {
          success: false,
          error: {
            code: 409,
            errorCode: 930003,
            message: "이미 저장한 링크입니다.",
            timestamp: "2026-08-26T00:00:00.000Z",
          },
        },
      }),
    );
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    expect(await screen.findByText("이미 저장된 링크예요")).toBeTruthy();
    expect(screen.queryByText("보기")).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("중복 응답에 linkId 가 있으면 '보기'가 기존 링크 상세를 연다", async () => {
    const { ApiError } = jest.requireActual("@shared/api/errors");
    mockPost.mockRejectedValueOnce(
      new ApiError({
        status: 409,
        data: {
          success: false,
          error: {
            code: 409,
            errorCode: 930003,
            message: "이미 저장한 링크입니다.",
            timestamp: "2026-08-26T00:00:00.000Z",
            linkId: 77,
          },
        },
      }),
    );
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    expect(await screen.findByText("이미 저장된 링크예요")).toBeTruthy();

    await userEvent.setup().press(screen.getByText("보기"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ params: { id: "77" } }),
    );
  });

  test("저장 중에는 pan-down 으로 닫히지 않는다", async () => {
    let resolvePost: (value: unknown) => void = () => {};
    mockPost.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    await fireEvent.press(screen.getByLabelText("sheet-dismiss"));
    expect(mockBack).not.toHaveBeenCalled();

    resolvePost({
      data: {
        success: true,
        data: { linkId: 1, url: "https://example.com", savedAt: "" },
      },
    });
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  test("저장 중에는 취소 버튼을 눌러도 시트가 닫히지 않는다", async () => {
    let resolvePost: (value: unknown) => void = () => {};
    mockPost.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    await renderSheet();
    await fillValidUrl();
    await pressSave();

    await fireEvent.press(screen.getByText("취소"));
    expect(mockBack).not.toHaveBeenCalled();

    resolvePost({
      data: {
        success: true,
        data: { linkId: 1, url: "https://example.com", savedAt: "" },
      },
    });
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  test("취소하면 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.press(screen.getByText("취소"));
    expect(mockBack).toHaveBeenCalled();
  });

  test("뒤로 갈 수 없으면 닫기 시 홈으로 이동한다", async () => {
    mockCanGoBack.mockReturnValue(false);
    await renderSheet();
    await fireEvent.press(screen.getByText("취소"));
    expect(mockReplace).toHaveBeenCalledWith("/");
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("클립보드에 문자열이 있으면 붙여넣기 버튼을 노출한다", async () => {
    const Clipboard = jest.requireMock("expo-clipboard");
    Clipboard.hasStringAsync.mockResolvedValueOnce(true);

    await renderSheet();
    await waitFor(() => expect(screen.getByText("붙여넣기")).toBeTruthy());
  });

  test("클립보드가 비어 있으면 붙여넣기 버튼을 숨긴다", async () => {
    await renderSheet();
    expect(screen.queryByText("붙여넣기")).toBeNull();
  });

  test("붙여넣기를 누르면 클립보드의 URL 이 입력된다", async () => {
    const Clipboard = jest.requireMock("expo-clipboard");
    Clipboard.hasStringAsync.mockResolvedValueOnce(true);
    Clipboard.getStringAsync.mockResolvedValueOnce("https://example.com");

    await renderSheet();
    await waitFor(() => expect(screen.getByText("붙여넣기")).toBeTruthy());
    await fireEvent.press(screen.getByText("붙여넣기"));
    await waitFor(() =>
      expect(screen.getByPlaceholderText("URL").props.value).toBe(
        "https://example.com",
      ),
    );
  });

  test("클립보드 읽기가 실패해도 크래시 없이 console.error 로만 남긴다", async () => {
    const Clipboard = jest.requireMock("expo-clipboard");
    const error = new Error("clipboard denied");
    Clipboard.hasStringAsync.mockResolvedValueOnce(true);
    Clipboard.getStringAsync.mockRejectedValueOnce(error);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await renderSheet();
    await waitFor(() => expect(screen.getByText("붙여넣기")).toBeTruthy());
    await fireEvent.press(screen.getByText("붙여넣기"));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(error));
    expect(screen.getByPlaceholderText("URL")).toBeTruthy();

    consoleError.mockRestore();
  });

  test("유효 URL 입력 후 blur 하면 프리뷰 카드가 뜬다", async () => {
    mockGetByUrl({
      "/links/preview": {
        title: "프리뷰 제목",
        source: "toss.tech",
        thumbnailUrl: "https://img.test/og.png",
      },
    });
    await renderSheet();
    const input = screen.getByPlaceholderText("URL");
    await fireEvent.changeText(input, "https://toss.tech/x");
    await fireEvent(input, "blur");
    expect(await screen.findByText("프리뷰 제목")).toBeOnTheScreen();
  });

  test("추출 실패 시 도메인 폴백 카드를 보여준다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockImplementation((url: string) => {
      if (url === "/links/preview") return Promise.reject(new Error("500"));
      if (url === "/folders")
        return Promise.resolve({
          data: { success: true, data: FOLDERS_RESPONSE },
        });
      return Promise.reject(new Error(`unhandled GET ${url}`));
    });
    await renderSheet();
    const input = screen.getByPlaceholderText("URL");
    await fireEvent.changeText(input, "https://toss.tech/x");
    await fireEvent(input, "blur");
    expect(await screen.findByText("toss.tech")).toBeOnTheScreen();
    spy.mockRestore();
  });

  test("무효 URL 로 blur 하면 프리뷰를 요청하지 않는다", async () => {
    await renderSheet();
    const input = screen.getByPlaceholderText("URL");
    await fireEvent.changeText(input, "not-a-url");
    await fireEvent(input, "blur");
    expect(mockGet).not.toHaveBeenCalledWith(
      "/links/preview",
      expect.anything(),
    );
  });

  // 시스템 시간을 전진시켜야 하는 유일한 시나리오 — 페이크 타이머 전환이 이후 테스트의
  // RNTL 렌더를 오염시키는 것을 막기 위해 스위트의 마지막 테스트로 둔다.
  test("리마인드가 과거 시각이면 저장 차단 + 안내", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    try {
      jest.setSystemTime(new Date("2026-08-26T14:32:00"));

      await renderSheet();
      await fillValidUrl();

      const toggleUser = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
      });
      await toggleUser.press(screen.getByRole("switch"));

      // 토글 on 기본값은 "내일 14:45"(현재+15분 올림) — 그 시각을 지나도록 시스템 시간을 전진시킨다.
      jest.setSystemTime(new Date("2026-08-28T00:00:00"));

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await user.press(screen.getByLabelText("저장"));

      expect(
        await screen.findByText(
          "선택한 시간이 이미 지났어요. 날짜나 시간을 변경해 주세요",
        ),
      ).toBeTruthy();
      expect(mockPost).not.toHaveBeenCalled();
      expect(mockBack).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
