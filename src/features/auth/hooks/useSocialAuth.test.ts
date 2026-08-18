import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login as kakaoLogin } from "@react-native-seoul/kakao-login";
import { renderHook } from "@testing-library/react-native";

import { SocialLoginCancelledError, useSocialAuth } from "./useSocialAuth";

describe("useSocialAuth", () => {
  const originalWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  beforeEach(() => {
    // 구글 로그인 경로는 webClientId 가 있어야 진행된다 — 기본으로 유효한 값을 채워두고,
    // 미설정 케이스만 개별 테스트에서 비운다.
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-client-id";
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = originalWebClientId;
  });

  test("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 가 없으면 명시적 에러를 던진다", async () => {
    // webClientId 는 idToken 발급에 필수(SDK 문서) — 없으면 SDK 내부 에러로 새지 않고
    // 웹 구현과 같은 톤의 명시적 에러로 원인을 알린다.
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "";
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("google")).rejects.toThrow(
      "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
    );
    expect(GoogleSignin.signIn).not.toHaveBeenCalled();
  });

  test("구글 로그인 성공 시 idToken 을 반환한다", async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValueOnce({
      type: "success",
      data: { idToken: "mock-id-token", user: {}, scopes: [] },
    });
    const { result } = await renderHook(() => useSocialAuth());

    const idToken = await result.current.getIdToken("google");

    expect(idToken).toBe("mock-id-token");
    expect(GoogleSignin.hasPlayServices).toHaveBeenCalled();
  });

  test("사용자가 로그인 창을 취소하면 SocialLoginCancelledError 를 던진다", async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValueOnce({
      type: "cancelled",
      data: null,
    });
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("google")).rejects.toBeInstanceOf(
      SocialLoginCancelledError,
    );
  });

  test("응답에 idToken 이 없으면 에러를 던진다", async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValueOnce({
      type: "success",
      data: { idToken: null, user: {}, scopes: [] },
    });
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("google")).rejects.toThrow();
  });

  test("카카오 로그인 성공 시 idToken 을 반환한다", async () => {
    (kakaoLogin as jest.Mock).mockResolvedValueOnce({
      accessToken: "mock-kakao-access-token",
      refreshToken: "mock-kakao-refresh-token",
      idToken: "mock-kakao-id-token",
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
      scopes: [],
    });
    const { result } = await renderHook(() => useSocialAuth());

    const idToken = await result.current.getIdToken("kakao");

    expect(idToken).toBe("mock-kakao-id-token");
  });

  test("카카오 응답에 idToken 이 없으면 에러를 던진다", async () => {
    (kakaoLogin as jest.Mock).mockResolvedValueOnce({
      accessToken: "mock-kakao-access-token",
      refreshToken: "mock-kakao-refresh-token",
      idToken: "",
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date(),
      scopes: [],
    });
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("kakao")).rejects.toThrow();
  });

  // 카카오 SDK 는 취소를 구분하는 신호를 문서화하지 않는다 — 임의로 추측해 분기하지 않고
  // 모든 실패를 일반 에러로 전파한다(구글과 달리 취소도 실패 안내가 뜬다).
  test("카카오 로그인이 실패하면(취소 포함) 에러를 던진다", async () => {
    (kakaoLogin as jest.Mock).mockRejectedValueOnce(
      new Error("user cancelled"),
    );
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("kakao")).rejects.toThrow();
  });
});
