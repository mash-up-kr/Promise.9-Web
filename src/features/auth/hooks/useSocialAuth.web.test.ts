// useSocialAuth.web.ts 가 카카오 교환에 apiClient 를 쓴다 — client.ts(env 필수)를 안 태우려고
// apiClient 만 목하고 contracts 는 실제 구현을 쓴다(LoginScreen.test.tsx 와 동일 패턴).
jest.mock("@shared/api", () => {
  const contracts = jest.requireActual("@shared/api/auth.contracts");
  return { apiClient: { post: jest.fn() }, ...contracts };
});

import { apiClient } from "@shared/api";
import { renderHook } from "@testing-library/react-native";

import { SocialLoginCancelledError } from "../auth.errors";
import {
  buildGoogleAuthUrl,
  buildKakaoAuthUrl,
  useSocialAuth,
} from "./useSocialAuth.web";

const mockPost = apiClient.post as jest.Mock;

const ORIGIN = "https://app.example.com";

interface FakePopup {
  closed: boolean;
  close: jest.Mock;
}

interface FakeWindow {
  open: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  location: { origin: string };
}

let fakeWindow: FakeWindow;
let popup: FakePopup;
// window.addEventListener("message", ...) 로 등록된 리스너 — 테스트가 직접 호출해 팝업 응답을 흉내낸다.
let messageListener: ((event: MessageEvent) => void) | null;

// jest-expo(react-native) 환경의 window 는 open/location 이 없는 껍데기라 브라우저 API 를 직접 심는다.
function installFakeWindow() {
  popup = { closed: false, close: jest.fn() };
  messageListener = null;
  fakeWindow = {
    open: jest.fn(() => popup),
    addEventListener: jest.fn((type: string, listener: unknown) => {
      if (type === "message") {
        messageListener = listener as (event: MessageEvent) => void;
      }
    }),
    removeEventListener: jest.fn(() => {
      messageListener = null;
    }),
    location: { origin: ORIGIN },
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fakeWindow,
  });
}

function emitMessage(data: unknown, origin = ORIGIN) {
  messageListener?.({ data, origin } as MessageEvent);
}

/** 팝업이 돌려준 fragment 파라미터에서 state 를 뽑는다 — 요청과 응답의 state 를 맞추기 위함. */
function sentState(): string {
  const url = new URL(fakeWindow.open.mock.calls[0][0] as string);
  return url.searchParams.get("state") ?? "";
}

describe("buildGoogleAuthUrl", () => {
  const url = () =>
    new URL(
      buildGoogleAuthUrl({
        clientId: "client-id",
        redirectUri: `${ORIGIN}/auth/google-callback.html`,
        nonce: "nonce-value",
        state: "state-value",
      }),
    );

  it("구글 인증 엔드포인트를 가리킨다", () => {
    expect(url().origin + url().pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
  });

  // access token 은 필요 없다 — 서버가 검증하는 건 idToken 뿐이다.
  it("id_token 만 요청한다", () => {
    expect(url().searchParams.get("response_type")).toBe("id_token");
  });

  it("openid scope 와 client_id·redirect_uri 를 싣는다", () => {
    expect(url().searchParams.get("scope")).toContain("openid");
    expect(url().searchParams.get("client_id")).toBe("client-id");
    expect(url().searchParams.get("redirect_uri")).toBe(
      `${ORIGIN}/auth/google-callback.html`,
    );
  });

  // implicit 흐름에서 Google 이 nonce 를 필수로 요구한다(replay 방지).
  it("nonce 와 state 를 싣는다", () => {
    expect(url().searchParams.get("nonce")).toBe("nonce-value");
    expect(url().searchParams.get("state")).toBe("state-value");
  });
});

describe("useSocialAuth (웹)", () => {
  beforeEach(() => {
    installFakeWindow();
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "web-client-id";
  });

  it("팝업이 idToken 을 보내면 그 값을 반환한다", async () => {
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    emitMessage({
      source: "promise9-google-auth",
      idToken: "web-id-token",
      state: sentState(),
    });

    await expect(promise).resolves.toBe("web-id-token");
    expect(popup.close).toHaveBeenCalled();
  });

  it("팝업이 차단되면 에러를 던진다", async () => {
    fakeWindow.open.mockReturnValueOnce(null);
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("google")).rejects.toThrow();
  });

  // state 불일치는 CSRF 의심 상황 — 받은 토큰을 절대 쓰지 않는다.
  it("state 가 다르면 토큰을 쓰지 않고 실패시킨다", async () => {
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    emitMessage({
      source: "promise9-google-auth",
      idToken: "web-id-token",
      state: "tampered-state",
    });

    await expect(promise).rejects.toThrow();
  });

  it("다른 origin 에서 온 메시지는 무시한다", async () => {
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    emitMessage(
      {
        source: "promise9-google-auth",
        idToken: "attacker-token",
        state: sentState(),
      },
      "https://evil.example.com",
    );
    // 무시됐으므로 이어서 온 정상 메시지로 resolve 돼야 한다.
    emitMessage({
      source: "promise9-google-auth",
      idToken: "web-id-token",
      state: sentState(),
    });

    await expect(promise).resolves.toBe("web-id-token");
  });

  it("구글이 error 를 돌려주면 실패시킨다", async () => {
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    emitMessage({
      source: "promise9-google-auth",
      error: "access_denied",
      state: sentState(),
    });

    await expect(promise).rejects.toThrow();
  });

  // 응답이 끝내 오지 않으면(사용자가 팝업을 닫았거나 멈춤) 타임아웃으로 조용히 종료한다.
  // COOP 환경에선 popup.closed 로 종료를 신뢰성 있게 감지할 수 없어 타임아웃이 유일한 취소 신호다.
  it("응답 없이 타임아웃되면 SocialLoginCancelledError 로 끝난다", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    promise.catch(() => {}); // 타이머 진행 전에 unhandled rejection 으로 잡히지 않도록.
    jest.advanceTimersByTime(10 * 60 * 1000);

    await expect(promise).rejects.toBeInstanceOf(SocialLoginCancelledError);
    jest.useRealTimers();
  });

  // 회귀: COOP(Cross-Origin-Opener-Policy)가 켜진 구글 페이지는 opener 관계를 끊고, Chrome 은
  // 그 팝업의 popup.closed 를 (예외가 아니라) true 로 돌려준다. 예전 폴링 구현은 이를 "닫힘"으로
  // 오판해 로그인 진행 중에 취소해버렸다. 이제 popup.closed 를 보지 않으므로, closed 가 true 라도
  // 뒤늦게 온 idToken 을 그대로 살려야 한다.
  it("COOP 로 popup.closed 가 true 여도 뒤늦은 idToken 을 살린다", async () => {
    jest.useFakeTimers();
    popup.closed = true;
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    // 동의 화면을 거치느라 오래 걸리는 상황(예전 폴링 주기 400ms 를 훨씬 초과).
    jest.advanceTimersByTime(30 * 1000);
    jest.useRealTimers();

    emitMessage({
      source: "promise9-google-auth",
      idToken: "web-id-token",
      state: sentState(),
    });

    await expect(promise).resolves.toBe("web-id-token");
  });
});

describe("buildKakaoAuthUrl", () => {
  const url = () =>
    new URL(
      buildKakaoAuthUrl({
        restApiKey: "rest-key",
        redirectUri: `${ORIGIN}/auth/kakao-callback.html`,
        state: "state-value",
      }),
    );

  it("카카오 authorize 엔드포인트를 가리킨다", () => {
    expect(url().origin + url().pathname).toBe(
      "https://kauth.kakao.com/oauth/authorize",
    );
  });

  // 서버 exchange 가 idToken 을 돌려주려면 openid scope 의 code 여야 한다.
  it("code 를 openid scope 로 요청한다", () => {
    expect(url().searchParams.get("response_type")).toBe("code");
    expect(url().searchParams.get("scope")).toContain("openid");
  });

  it("client_id·redirect_uri·state 를 싣는다", () => {
    expect(url().searchParams.get("client_id")).toBe("rest-key");
    expect(url().searchParams.get("redirect_uri")).toBe(
      `${ORIGIN}/auth/kakao-callback.html`,
    );
    expect(url().searchParams.get("state")).toBe("state-value");
  });
});

describe("useSocialAuth 카카오 (웹)", () => {
  beforeEach(() => {
    installFakeWindow();
    process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = "kakao-rest-key";
    mockPost.mockReset();
  });

  it("팝업 code 를 서버로 교환해 idToken 을 반환한다", async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, data: { idToken: "kakao-web-id-token" } },
    });
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("kakao");
    emitMessage({
      source: "promise9-kakao-auth",
      code: "auth-code",
      state: sentState(),
    });

    await expect(promise).resolves.toBe("kakao-web-id-token");
    expect(mockPost).toHaveBeenCalledWith("/auth/kakao/exchange", {
      code: "auth-code",
      redirectUri: `${ORIGIN}/auth/kakao-callback.html`,
    });
    expect(popup.close).toHaveBeenCalled();
  });

  it("REST 키가 없으면 명시적 에러를 던진다", async () => {
    process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY = "";
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("kakao")).rejects.toThrow(
      "EXPO_PUBLIC_KAKAO_REST_API_KEY",
    );
  });

  // state 불일치는 CSRF 의심 — code 를 서버로 보내지 않는다.
  it("state 가 다르면 교환하지 않고 실패시킨다", async () => {
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("kakao");
    emitMessage({
      source: "promise9-kakao-auth",
      code: "auth-code",
      state: "tampered-state",
    });

    await expect(promise).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("서버 교환이 실패하면 에러가 전파된다", async () => {
    mockPost.mockRejectedValueOnce(new Error("exchange failed"));
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("kakao");
    emitMessage({
      source: "promise9-kakao-auth",
      code: "auth-code",
      state: sentState(),
    });

    await expect(promise).rejects.toThrow();
  });

  // 구글 웹과 동일 — COOP 로 popup.closed 를 못 믿으므로, 응답이 오지 않으면 타임아웃으로 종료한다.
  it("응답 없이 타임아웃되면 SocialLoginCancelledError 로 끝난다", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("kakao");
    promise.catch(() => {}); // 타이머 진행 전에 unhandled rejection 으로 잡히지 않도록.
    jest.advanceTimersByTime(10 * 60 * 1000);

    await expect(promise).rejects.toBeInstanceOf(SocialLoginCancelledError);
    jest.useRealTimers();
  });
});
