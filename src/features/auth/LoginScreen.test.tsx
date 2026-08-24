// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 나머지(에러 유틸·토큰 저장소·contracts)는 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  const token = jest.requireActual("@shared/api/token");
  const contracts = jest.requireActual("@shared/api/auth.contracts");
  return {
    apiClient: { get: jest.fn(), post: jest.fn() },
    ...errors,
    ...token,
    ...contracts,
  };
});

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login as kakaoLogin } from "@react-native-seoul/kakao-login";
import { ApiError, apiClient } from "@shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import type { AxiosResponse } from "axios";
import * as AppleAuthentication from "expo-apple-authentication";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { AUTH_ERROR_CODE } from "./auth.errors";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { LoginScreen } from "./LoginScreen";

const mockPost = apiClient.post as jest.Mock;
const mockSignIn = GoogleSignin.signIn as jest.Mock;
const mockKakaoLogin = kakaoLogin as jest.Mock;

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
    mockPost.mockReset();
    mockSignIn.mockReset();
    mockKakaoLogin.mockReset();
    (AppleAuthentication.signInAsync as jest.Mock).mockReset();
    // useSocialAuth 의 구글 경로는 webClientId 가 있어야 진행된다.
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-client-id";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = originalWebClientId;
  });

  test("소셜 버튼 3개를 노출하고, iOS 에선 셋 다 활성화한다", async () => {
    await renderScreen();

    // 시안대로 3개 모두 노출한다.
    const google = screen.getByRole("button", { name: "Google로 계속하기" });
    const kakao = screen.getByRole("button", { name: "카카오로 계속하기" });
    const apple = screen.getByRole("button", { name: "Apple로 계속하기" });

    // 구글·카카오는 플랫폼 무관 활성. 애플은 iOS 만 지원 — 이 테스트 환경(Platform.OS==="ios")에선 활성.
    // (웹·안드로이드 비활성은 auth.constants.test.ts 가 검증한다.)
    expect(google.props.accessibilityState.disabled).toBe(false);
    expect(kakao.props.accessibilityState.disabled).toBe(false);
    expect(apple.props.accessibilityState.disabled).toBe(false);
  });

  test("카카오 로그인 성공 시 idToken 으로 서버 로그인하고 홈으로 이동한다", async () => {
    mockKakaoLogin.mockResolvedValue({
      idToken: "kakao-id-token",
      accessToken: "a",
      refreshToken: "r",
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
      scopes: [],
    });
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: { accessToken: "at", refreshToken: "rt", isNewUser: false },
      },
    });
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "카카오로 계속하기" }),
    );

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/auth/social", {
        provider: "kakao",
        idToken: "kakao-id-token",
      }),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  test("애플 로그인 성공 시 idToken 으로 서버 로그인하고 홈으로 이동한다", async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
      identityToken: "apple-id-token",
      user: "user-id",
      email: null,
      fullName: null,
      realUserStatus: 1,
      authorizationCode: "auth-code",
    });
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: { accessToken: "at", refreshToken: "rt", isNewUser: false },
      },
    });
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Apple로 계속하기" }),
    );

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/auth/social", {
        provider: "apple",
        idToken: "apple-id-token",
      }),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
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
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockSignIn.mockResolvedValue({ type: "cancelled", data: null });
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    // 취소는 실패가 아니다 — 개발 콘솔에도 에러로 남기지 않는다.
    expect(errorSpy).not.toHaveBeenCalledWith(
      "소셜 로그인 실패",
      expect.anything(),
    );
    errorSpy.mockRestore();
  });

  // 스낵바는 원인 불문 같은 문구라, 개발자가 실패 원인(미설정 env·팝업 차단·state 불일치 등)을
  // 알 수 있게 콘솔에 남겨야 한다.
  test("로그인이 실패하면 개발용으로 원인을 콘솔에 남긴다", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // idToken 을 못 받아 getIdToken 이 throw 하는 경로(서버 호출 전 실패).
    mockSignIn.mockResolvedValue(googleSuccess(null));
    await renderScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Google로 계속하기" }),
    );

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "소셜 로그인 실패",
        expect.any(Error),
      ),
    );
    expect(mockPost).not.toHaveBeenCalled();
    errorSpy.mockRestore();
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
});
