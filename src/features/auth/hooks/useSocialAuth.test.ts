import { GoogleSignin } from "@react-native-google-signin/google-signin";
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

  test("카카오는 아직 지원하지 않아 에러를 던진다", async () => {
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("kakao")).rejects.toThrow();
  });
});
