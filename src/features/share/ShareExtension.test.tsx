jest.mock("expo-share-extension", () => ({
  close: jest.fn(),
  openHostApp: jest.fn(),
}));
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  const token = jest.requireActual("@shared/api/token");
  const contracts = jest.requireActual("@shared/api/auth.contracts");
  return {
    apiClient: { get: jest.fn(), post: jest.fn() },
    refreshAccessToken: jest.fn(),
    ...errors,
    ...token,
    ...contracts,
  };
});
const mockGetIdToken = jest.fn();
jest.mock("@/features/auth/hooks/useSocialAuth", () => ({
  useSocialAuth: () => ({ getIdToken: mockGetIdToken }),
}));

import {
  apiClient,
  clearTokens,
  refreshAccessToken,
  setAccessToken,
  setTokenPersistence,
  setTokens,
} from "@shared/api";
import { ApiError, UnauthorizedError } from "@shared/api/errors";
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { close, openHostApp } from "expo-share-extension";

import { ShareExtension } from "./ShareExtension";

const mockPost = apiClient.post as jest.Mock;
const mockGet = apiClient.get as jest.Mock;

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

function duplicateError(linkId?: number) {
  return new ApiError({
    status: 409,
    data: {
      success: false,
      error: {
        code: 409,
        errorCode: 930003,
        message: "이미 저장한 링크입니다.",
        timestamp: "",
        ...(linkId != null ? { linkId } : {}),
      },
    },
  } as never);
}

function unauthorizedError() {
  return new UnauthorizedError({
    status: 401,
    data: {
      success: false,
      error: {
        code: 401,
        errorCode: 950001,
        message: "유효하지 않은 토큰입니다.",
        timestamp: "",
      },
    },
  } as never);
}

let storedRefreshToken: string | null = "rtk";

const mockRefreshAccessToken = refreshAccessToken as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRefreshAccessToken.mockResolvedValue("atk");
  // 메모리 액세스 토큰은 모듈 전역 — 앞 테스트의 로그인이 남긴 값을 비워 진입 조건을 통일한다.
  setAccessToken(null);
  storedRefreshToken = "rtk";
  setTokenPersistence({
    getRefreshToken: async () => storedRefreshToken,
    setRefreshToken: async (token) => {
      storedRefreshToken = token;
    },
  });
  mockGet.mockImplementation((url: string) => {
    if (url === "/links/preview") {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            title: "토스 기술 블로그",
            source: "toss.tech",
            thumbnailUrl: null,
          },
        },
      });
    }
    return Promise.resolve({ data: { success: true, data: FOLDERS_RESPONSE } });
  });
});

test("공유받은 URL 을 표시한다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  expect(await screen.findByText("https://toss.tech/a")).toBeOnTheScreen();
});

test("공유 URL 의 프리뷰 제목을 카드에 보여준다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  expect(await screen.findByText("토스 기술 블로그")).toBeOnTheScreen();
});

test("취소를 누르면 퇴장 애니메이션 후 익스텐션을 닫는다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  await userEvent.setup().press(await screen.findByText("취소"));
  await waitFor(() => expect(close).toHaveBeenCalled());
});

test("저장 성공 → 성공 시트, '링크 보러가기'는 저장한 링크 상세를 연다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 42 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("저장"));

  expect(await screen.findByText("링크 저장을 완료했어요")).toBeOnTheScreen();
  expect(mockPost).toHaveBeenCalledWith("/links", {
    url: "https://toss.tech/a",
    folderId: null,
    memo: null,
    reminderAt: null,
  });

  await user.press(screen.getByText("링크 보러가기"));
  expect(openHostApp).toHaveBeenCalledWith("link/42");
});

test("중복 저장 → 중복 시트, '링크 보러가기'는 기존 링크 상세를 연다", async () => {
  mockPost.mockRejectedValue(duplicateError(77));
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("저장"));

  expect(await screen.findByText("이미 저장된 링크예요")).toBeOnTheScreen();
  expect(
    screen.getByText("이전에 저장한 링크를 확인해보세요"),
  ).toBeOnTheScreen();

  await user.press(screen.getByText("링크 보러가기"));
  expect(openHostApp).toHaveBeenCalledWith("link/77");
});

test("중복인데 linkId 가 없으면(구버전 응답) '링크 보러가기'는 홈을 연다", async () => {
  mockPost.mockRejectedValue(duplicateError());
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("저장"));
  await user.press(await screen.findByText("링크 보러가기"));
  expect(openHostApp).toHaveBeenCalledWith("/");
});

test("저장 실패 → 실패 시트, '다시 시도'가 같은 URL 로 재요청한다", async () => {
  mockPost.mockRejectedValue(new Error("network"));
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("저장"));
  expect(await screen.findByText("링크를 저장하지 못했어요")).toBeOnTheScreen();
  expect(
    screen.getByText("네트워크 연결을 확인한 뒤 다시 시도해주세요"),
  ).toBeOnTheScreen();

  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 7 } } });
  await user.press(screen.getByText("다시 시도"));
  expect(await screen.findByText("링크 저장을 완료했어요")).toBeOnTheScreen();
  expect(mockPost).toHaveBeenCalledTimes(2);
});

test("3회 연속 실패 → 반복 실패 시트, '닫기'는 익스텐션을 닫는다", async () => {
  mockPost.mockRejectedValue(new Error("network"));
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("저장"));
  expect(await screen.findByText("다시 시도")).toBeOnTheScreen();
  await user.press(screen.getByText("다시 시도"));
  expect(await screen.findByText("다시 시도")).toBeOnTheScreen();
  await user.press(screen.getByText("다시 시도"));

  expect(
    await screen.findByText("잠시 후 다시 시도해주세요"),
  ).toBeOnTheScreen();
  await user.press(screen.getByText("닫기"));
  await waitFor(() => expect(close).toHaveBeenCalled());
});

test("성공 시트는 성공 마스코트 그래픽을 보여준다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 42 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(await screen.findByText("저장"));

  expect(await screen.findByTestId("share-result-success")).toBeOnTheScreen();
});

test("중복 시트는 중복 마스코트 그래픽을 보여준다", async () => {
  mockPost.mockRejectedValue(duplicateError(77));
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(await screen.findByText("저장"));

  expect(await screen.findByTestId("share-result-duplicate")).toBeOnTheScreen();
});

test("폴더 목록을 칩으로 보여주고 기본 선택은 미분류다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);

  expect(await screen.findByText("디자인")).toBeOnTheScreen();
  expect(screen.getByText("개발")).toBeOnTheScreen();
  expect(
    screen.getByLabelText("미분류").props.accessibilityState.selected,
  ).toBe(true);
});

test("폴더 칩을 선택해 저장하면 folderId 가 실린다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("디자인"));
  await user.press(screen.getByText("저장"));

  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ folderId: 1 }),
  );
});

test("폴더 추가 → 이름 입력·만들기 → 새 폴더가 목록에 추가되고 선택된다", async () => {
  mockPost.mockImplementation((url: string) => {
    if (url === "/folders") {
      return Promise.resolve({
        data: {
          success: true,
          data: {
            folderId: 9,
            folderName: "새폴더",
            color: "#61a8ef",
            createdAt: "",
          },
        },
      });
    }
    return Promise.resolve({ data: { success: true, data: { linkId: 1 } } });
  });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByLabelText("폴더 추가"));
  await user.type(
    screen.getByPlaceholderText("폴더 이름을 입력하세요."),
    "새폴더",
  );
  await user.press(screen.getAllByText("저장").at(-1) as never);

  expect(await screen.findByText("새폴더")).toBeOnTheScreen();
  expect(
    screen.getByLabelText("새폴더").props.accessibilityState.selected,
  ).toBe(true);

  await user.press(screen.getByText("저장"));
  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ folderId: 9 }),
  );
});

test("폴더 이름이 중복이면 안내 문구를 보여준다", async () => {
  const { ApiError } = jest.requireActual("@shared/api/errors");
  mockPost.mockRejectedValue(
    new ApiError({
      status: 409,
      data: {
        success: false,
        error: {
          code: 409,
          errorCode: 920002,
          message: "이미 존재하는 폴더 이름입니다.",
          timestamp: "",
        },
      },
    } as never),
  );
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByLabelText("폴더 추가"));
  await user.type(
    screen.getByPlaceholderText("폴더 이름을 입력하세요."),
    "디자인",
  );
  await user.press(screen.getAllByText("저장").at(-1) as never);

  expect(
    await screen.findByText("같은 이름의 폴더가 있어요"),
  ).toBeOnTheScreen();
});

test("리마인드는 기본 Off — reminderAt 없이(null) 저장된다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(await screen.findByText("저장"));

  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ reminderAt: null }),
  );
});

test("리마인드를 켜면 내일 프리셋이 선택되고 reminderAt 이 실린다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByLabelText("리마인드"));

  expect(screen.getByLabelText("내일").props.accessibilityState.selected).toBe(
    true,
  );

  await user.press(screen.getByText("저장"));
  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ reminderAt: expect.stringMatching(/^\d{4}-/) }),
  );
});

test("프리셋 칩을 고르면 해당 날짜로 리마인드가 실린다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByLabelText("리마인드"));
  await user.press(screen.getByLabelText("7일 후"));
  await user.press(screen.getByText("저장"));

  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const expectedDate = [
    sevenDaysLater.getFullYear(),
    String(sevenDaysLater.getMonth() + 1).padStart(2, "0"),
    String(sevenDaysLater.getDate()).padStart(2, "0"),
  ].join("-");
  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({
      reminderAt: expect.stringContaining(expectedDate),
    }),
  );
});

test("리마인드 날짜를 누르면 날짜 피커가 열리고, 확인하면 프리셋 선택이 풀린다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByLabelText("리마인드"));
  await user.press(screen.getByLabelText("날짜 선택"));
  expect(await screen.findByText("날짜 선택")).toBeOnTheScreen();

  await user.press(screen.getByText("확인"));
  expect(screen.queryByText("날짜 선택")).toBeNull();
  expect(screen.getByLabelText("내일").props.accessibilityState.selected).toBe(
    false,
  );
});

test("리마인드 시간을 누르면 시간 피커가 열린다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByLabelText("리마인드"));
  await user.press(screen.getByLabelText("시간 선택"));

  expect(await screen.findByText("시간 선택")).toBeOnTheScreen();
});

test("리마인드를 다시 끄면 reminderAt 없이 저장된다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByLabelText("리마인드"));
  await user.press(await screen.findByLabelText("리마인드"));
  await user.press(screen.getByText("저장"));

  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ reminderAt: null }),
  );
});

test("메모를 입력해 저장하면 앞뒤 공백을 제거해 실린다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.type(
    await screen.findByPlaceholderText(
      "저장한 이유나 기억하고 싶은 점을 적어보세요",
    ),
    "  나중에 읽기  ",
  );
  await user.press(screen.getByText("저장"));

  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ memo: "나중에 읽기" }),
  );
});

test("폴더 목록 로딩이 실패해도 미분류로 저장할 수 있다", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  mockGet.mockRejectedValue(new Error("network"));
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(await screen.findByText("저장"));

  expect(await screen.findByText("링크 저장을 완료했어요")).toBeOnTheScreen();
  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ folderId: null }),
  );
  spy.mockRestore();
});

test("리프레시 토큰이 없으면 로그인 시트를 먼저 보여준다", async () => {
  storedRefreshToken = null;
  await render(<ShareExtension url="https://toss.tech/a" />);

  expect(await screen.findByText("로그인이 필요해요")).toBeOnTheScreen();
  expect(screen.queryByText("저장")).not.toBeOnTheScreen();
  expect(mockGet).not.toHaveBeenCalledWith("/folders");
});

test("로그인에 성공하면 같은 시트에서 저장 화면으로 넘어가고 폴더를 불러온다", async () => {
  storedRefreshToken = null;
  mockGetIdToken.mockResolvedValue("google-id-token");
  mockPost.mockResolvedValue({
    data: {
      success: true,
      data: { accessToken: "atk", refreshToken: "rtk", isNewUser: false },
    },
  });
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(await screen.findByText("Google로 계속하기"));

  expect(await screen.findByText("저장")).toBeOnTheScreen();
  expect(await screen.findByText("디자인")).toBeOnTheScreen();
  expect(mockGet).toHaveBeenCalledWith("/folders");
});

test("저장 중 세션이 끊기면(refresh 실패로 토큰 삭제) 로그인 시트로 돌아간다", async () => {
  mockPost.mockImplementation(async () => {
    // client.ts 인터셉터가 refresh 실패 시 하는 일을 흉내 낸다.
    await clearTokens();
    throw unauthorizedError();
  });
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(await screen.findByText("저장"));

  expect(await screen.findByText("로그인이 필요해요")).toBeOnTheScreen();
  expect(screen.getByText("다시 로그인해주세요")).toBeOnTheScreen();
});

test("세션 이탈 후 재로그인하면 편집 시트(저장 화면)로 돌아간다", async () => {
  mockPost.mockImplementation(async () => {
    // client.ts 인터셉터가 refresh 실패 시 하는 일을 흉내 낸다.
    await clearTokens();
    throw unauthorizedError();
  });
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(await screen.findByText("저장"));
  expect(await screen.findByText("로그인이 필요해요")).toBeOnTheScreen();

  storedRefreshToken = "rtk";
  await act(async () => {
    await setTokens("atk", "rtk");
  });

  expect(await screen.findByText("저장")).toBeOnTheScreen();
});

test("URL 형식이 아니면 서버에 보내지 않고 저장 불가 시트를 보여준다", async () => {
  await render(<ShareExtension url="이건 링크가 아니에요" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("저장"));

  expect(await screen.findByText("저장할 수 없는 링크예요")).toBeOnTheScreen();
  expect(mockPost).not.toHaveBeenCalled();

  await user.press(screen.getByText("닫기"));
  await waitFor(() => expect(close).toHaveBeenCalled());
});

test("로그인 상태로 진입하면 저장 시트를 띄우기 전에 액세스 토큰을 한 번 재발급한다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);

  expect(await screen.findByText("저장")).toBeOnTheScreen();
  expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
});

test("저장 시트 스크롤은 키보드 높이만큼 인셋을 넣어 메모 입력이 가려지지 않게 한다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  const scroll = await screen.findByTestId("share-entry-scroll");
  expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
});
