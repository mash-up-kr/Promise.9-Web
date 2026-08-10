import { renderHook } from "@testing-library/react-native";

import { SocialLoginCancelledError } from "../auth.errors";
import { buildGoogleAuthUrl, useSocialAuth } from "./useSocialAuth.web";

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

  it("사용자가 팝업을 닫으면 SocialLoginCancelledError 를 던진다", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    popup.closed = true;
    jest.advanceTimersByTime(1000);

    await expect(promise).rejects.toBeInstanceOf(SocialLoginCancelledError);
    jest.useRealTimers();
  });

  // COOP(Cross-Origin-Opener-Policy)가 켜진 환경에서는 popup.closed 접근이 막힌다.
  // 취소 감지를 포기할지언정, 로그인이 성공했는데 "취소됨"으로 끝나는 일은 없어야 한다.
  it("popup.closed 접근이 COOP 로 막혀도 로그인 결과를 그대로 살린다", async () => {
    jest.useFakeTimers();
    Object.defineProperty(popup, "closed", {
      get() {
        throw new Error("Cross-Origin-Opener-Policy would block window.closed");
      },
    });
    const { result } = await renderHook(() => useSocialAuth());

    const promise = result.current.getIdToken("google");
    jest.advanceTimersByTime(2000);
    jest.useRealTimers();

    emitMessage({
      source: "promise9-google-auth",
      idToken: "web-id-token",
      state: sentState(),
    });

    await expect(promise).resolves.toBe("web-id-token");
  });

  it("카카오는 아직 지원하지 않아 에러를 던진다", async () => {
    const { result } = await renderHook(() => useSocialAuth());

    await expect(result.current.getIdToken("kakao")).rejects.toThrow();
  });
});
