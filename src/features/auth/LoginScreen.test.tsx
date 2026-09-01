// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 나머지(에러 유틸·토큰 저장소·contracts)는 실제 구현을 쓴다.
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

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  ApiError,
  apiClient,
  setAccessToken,
  setTokenPersistence,
} from "@shared/api";
import { EXTENSION_LOGIN_MESSAGE_SOURCE } from "@shared/extension/extensionLogin.contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import type { AxiosResponse } from "axios";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { AUTH_ERROR_CODE } from "./auth.errors";

const mockReplace = jest.fn();
const mockParams = jest.fn<Record<string, string>, []>(() => ({}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams(),
}));

import { LoginScreen } from "./LoginScreen";

const mockPost = apiClient.post as jest.Mock;
const mockSignIn = GoogleSignin.signIn as jest.Mock;

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={metrics}>
        <SnackbarProvider>
          <LoginScreen />
        </SnackbarProvider>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

const googleSuccess = (idToken: string | null = "mock-id-token") => ({
  type: "success",
  data: { idToken, user: {}, scopes: [] },
});

const apiError = (status: number, errorCode: number) =>
  new ApiError({
    status,
    data: {
      success: false,
      error: {
        code: status,
        errorCode,
        message: "실패",
        timestamp: "2026-08-01T00:00:00.000Z",
      },
    },
  } as unknown as AxiosResponse);

describe("LoginScreen", () => {
  const originalWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  beforeEach(() => {
    mockReplace.mockClear();
    mockParams.mockReturnValue({});
    mockPost.mockReset();
    mockSignIn.mockReset();
    // useSocialAuth 의 구글 경로는 webClientId 가 있어야 진행된다.
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-client-id";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = originalWebClientId;
  });

  test("소셜 버튼 3개를 모두 노출하되, 미지원 provider 는 비활성으로 둔다", async () => {
    await renderScreen();

    // 시안대로 3개 모두 노출한다.
    const google = screen.getByRole("button", { name: "Google로 계속하기" });
    const kakao = screen.getByRole("button", { name: "카카오로 계속하기" });
    const apple = screen.getByRole("button", { name: "Apple로 계속하기" });

    // 구글만 활성, 아직 서버 미구현인 카카오·애플은 비활성(disabled).
    expect(google.props.accessibilityState.disabled).toBe(false);
    expect(kakao.props.accessibilityState.disabled).toBe(true);
    expect(apple.props.accessibilityState.disabled).toBe(true);
  });

  test("미지원(카카오) 버튼을 눌러도 로그인 로직이 실행되지 않는다", async () => {
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "카카오로 계속하기" }),
    );

    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  test("구글 로그인 성공 시 idToken 으로 서버 로그인하고 홈으로 이동한다", async () => {
    mockSignIn.mockResolvedValue(googleSuccess());
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: { accessToken: "at", refreshToken: "rt", isNewUser: false },
      },
    });
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/auth/social", {
        provider: "google",
        idToken: "mock-id-token",
      }),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  test("사용자가 로그인 창을 취소하면 아무 일도 일어나지 않는다", async () => {
    mockSignIn.mockResolvedValue({ type: "cancelled", data: null });
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("idToken 을 못 받으면 실패 안내를 보여준다", async () => {
    mockSignIn.mockResolvedValue(googleSuccess(null));
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    expect(
      await screen.findByText("로그인에 실패했어요. 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(mockPost).not.toHaveBeenCalled();
  });

  test("서버 로그인이 실패하면(errorCode 950003) 안내를 보여준다", async () => {
    mockSignIn.mockResolvedValue(googleSuccess());
    mockPost.mockRejectedValue(
      apiError(401, AUTH_ERROR_CODE.SOCIAL_TOKEN_VERIFICATION_FAILED),
    );
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    expect(
      await screen.findByText("로그인에 실패했어요. 다시 시도해주세요."),
    ).toBeOnTheScreen();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("지원하지 않는 provider 면(errorCode 950004) 별도 안내를 보여준다", async () => {
    mockSignIn.mockResolvedValue(googleSuccess());
    mockPost.mockRejectedValue(
      apiError(400, AUTH_ERROR_CODE.UNSUPPORTED_PROVIDER),
    );
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    expect(
      await screen.findByText("아직 지원하지 않는 로그인 방식이에요."),
    ).toBeOnTheScreen();
  });

  test("로그인 진행 중에는 버튼이 비활성화된다", async () => {
    // 즉시 응답하지 않는 대기 상태를 흉내낸다 — 테스트 끝에서 반드시 resolve 해 열린 핸들을 남기지 않는다.
    let resolveSignIn!: (value: { type: string; data: null }) => void;
    mockSignIn.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    await renderScreen();

    // signIn 이 아직 pending 이라 onPress 의 Promise 도 끝나지 않는다 — act() 가 감싸는
    // fireEvent.press 를 await 하면 테스트가 함께 멈추므로, 여기서만 fire-and-forget 으로 누른다.
    fireEvent.press(screen.getByRole("button", { name: "Google로 계속하기" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Google로 계속하기" }).props
          .accessibilityState.disabled,
      ).toBe(true),
    );

    // resolve 후 상태 업데이트(취소 처리 → pendingProvider 해제)가 끝날 때까지 기다려,
    // act() 밖에서 setState 가 실행된다는 경고와 잔여 프라미스가 다음 테스트로 새는 것을 막는다.
    resolveSignIn({ type: "cancelled", data: null });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Google로 계속하기" }).props
          .accessibilityState.disabled,
      ).toBe(false),
    );
  });

  describe("크롬 익스텐션 인계", () => {
    const originalExtensionId = process.env.EXPO_PUBLIC_EXTENSION_ID;
    const chromeGlobal = globalThis as { chrome?: unknown };
    const sendMessage = jest.fn();

    // 리프레시 토큰이 영속 저장돼 있는(로그인 이력이 있는) 상태를 흉내낸다.
    const loggedInPersistence = {
      getRefreshToken: async () => "web-rt",
      setRefreshToken: async () => {},
    };

    beforeEach(() => {
      process.env.EXPO_PUBLIC_EXTENSION_ID = "ext-id";
      chromeGlobal.chrome = { runtime: { sendMessage } };
      sendMessage.mockReset().mockResolvedValue({ ok: true });
      mockSignIn.mockResolvedValue(googleSuccess());
      // /auth/social 과 /auth/extension-token 을 같은 mock 이 받는다 — URL 로 구분.
      mockPost.mockImplementation((url: string) =>
        url === "/auth/extension-token"
          ? Promise.resolve({
              data: {
                success: true,
                data: { accessToken: "ext-at", refreshToken: "ext-rt" },
              },
            })
          : Promise.resolve({
              data: {
                success: true,
                data: {
                  accessToken: "at",
                  refreshToken: "rt",
                  isNewUser: false,
                },
              },
            }),
      );
    });

    afterEach(() => {
      process.env.EXPO_PUBLIC_EXTENSION_ID = originalExtensionId;
      setTokenPersistence(null);
      setAccessToken(null);
      delete chromeGlobal.chrome;
      delete (globalThis as { close?: () => void }).close;
    });

    test("?return=extension 이면 로그인 후 익스텐션용 토큰쌍을 발급해 넘긴다", async () => {
      mockParams.mockReturnValue({ return: "extension" });
      await renderScreen();

      await fireEvent.press(
        screen.getByRole("button", { name: "Google로 계속하기" }),
      );

      // 웹 로그인이 먼저다 — 그 세션의 액세스 토큰으로 익스텐션용 토큰쌍을 발급받는다.
      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith("/auth/social", {
          provider: "google",
          idToken: "mock-id-token",
        }),
      );
      await waitFor(() =>
        expect(sendMessage).toHaveBeenCalledWith("ext-id", {
          source: EXTENSION_LOGIN_MESSAGE_SOURCE,
          accessToken: "ext-at",
          refreshToken: "ext-rt",
        }),
      );
      // 홈으로 가지 않고 연결 화면을 보여준다 — 연결이 끝나면 익스텐션이 이 탭을 닫는다.
      expect(
        await screen.findByText("익스텐션에 계정이 연결됐어요"),
      ).toBeOnTheScreen();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    test("이미 로그인돼 있으면 소셜 로그인 없이 바로 연결한다", async () => {
      mockParams.mockReturnValue({ return: "extension" });
      setTokenPersistence(loggedInPersistence);
      setAccessToken("web-at");
      await renderScreen();

      await waitFor(() =>
        expect(sendMessage).toHaveBeenCalledWith(
          "ext-id",
          expect.objectContaining({ accessToken: "ext-at" }),
        ),
      );
      expect(
        await screen.findByText("익스텐션에 계정이 연결됐어요"),
      ).toBeOnTheScreen();
      // 소셜 로그인 화면을 거치지 않는다.
      expect(
        screen.queryByRole("button", { name: "Google로 계속하기" }),
      ).toBeNull();
      expect(mockPost).not.toHaveBeenCalledWith(
        "/auth/social",
        expect.anything(),
      );
    });

    test("연결에 실패하면 다시 시도할 수 있다", async () => {
      mockParams.mockReturnValue({ return: "extension" });
      setTokenPersistence(loggedInPersistence);
      setAccessToken("web-at");
      sendMessage.mockRejectedValueOnce(new Error("no receiver"));
      await renderScreen();

      expect(
        await screen.findByText("연결에 실패했어요. 다시 시도해주세요."),
      ).toBeOnTheScreen();

      await fireEvent.press(screen.getByRole("button", { name: "다시 시도" }));

      expect(
        await screen.findByText("익스텐션에 계정이 연결됐어요"),
      ).toBeOnTheScreen();
    });

    test("연결 완료 화면의 버튼으로 로그인 탭을 닫는다", async () => {
      mockParams.mockReturnValue({ return: "extension" });
      setTokenPersistence(loggedInPersistence);
      setAccessToken("web-at");
      // 이 탭은 익스텐션이 열었고 내비게이션 이력이 없어 window.close() 로 닫을 수 있다.
      const closeTab = jest.fn();
      (globalThis as { close?: () => void }).close = closeTab;
      await renderScreen();

      await fireEvent.press(
        await screen.findByRole("button", { name: "원래 탭으로 돌아가기" }),
      );

      expect(closeTab).toHaveBeenCalled();
    });

    test("return 쿼리가 없으면 익스텐션에 아무것도 보내지 않는다", async () => {
      await renderScreen();

      await fireEvent.press(
        screen.getByRole("button", { name: "Google로 계속하기" }),
      );

      await waitFor(() => expect(mockPost).toHaveBeenCalled());
      expect(sendMessage).not.toHaveBeenCalled();
      expect(mockPost).not.toHaveBeenCalledWith("/auth/extension-token");
    });
  });
});
