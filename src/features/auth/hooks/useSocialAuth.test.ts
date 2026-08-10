import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { login as kakaoLogin } from "@react-native-seoul/kakao-login";
import { renderHook } from "@testing-library/react-native";

import { SocialLoginCancelledError, useSocialAuth } from "./useSocialAuth";

describe("useSocialAuth", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
