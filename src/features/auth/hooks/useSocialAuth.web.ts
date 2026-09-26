import {
  apiClient,
  type KakaoExchangeRequest,
  kakaoExchangeResponseSchema,
  type SuccessResponse,
} from "@shared/api";
import { useCallback, useEffect } from "react";

import type { SocialProvider } from "../auth.constants";
import { SocialLoginCancelledError } from "../auth.errors";

// 네이티브 구현(useSocialAuth.ts)과 export 표면을 맞춘다 — 화면은 어느 쪽이 로드되든 같은 import 를 쓴다.
export { SocialLoginCancelledError };

/**
 * 웹 구글 로그인 — OIDC implicit 팝업.
 *
 * `@react-native-google-signin` 무료판은 웹을 지원하지 않고(웹 구현은 스폰서 전용),
 * GIS(`google.accounts.id`)는 credential 을 자기 버튼/One Tap 콜백으로만 돌려줘
 * `getIdToken(): Promise<string>` 인터페이스와 맞물리지 않는다. 그래서 인증 URL 을 직접 열고
 * fragment 로 돌아온 id_token 을 회수한다. access token 은 요청하지 않으므로(response_type=id_token)
 * implicit 흐름의 통상적 위험(액세스 토큰 노출)에 해당하지 않고, 토큰 검증은 서버가 한다.
 */
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

/** 콜백 페이지(public/auth/google-callback.html)가 postMessage 로 보낼 때 붙이는 표식. */
const CALLBACK_MESSAGE_SOURCE = "promise9-google-auth";
const CALLBACK_PATH = "/auth/google-callback.html";

const POPUP_FEATURES = "popup,width=480,height=640";
/**
 * 응답이 올 때까지 기다리는 최대 시간(ms). 초과하면 취소로 보고 조용히 종료한다.
 *
 * 팝업이 구글/카카오(COOP: same-origin)로 이동하면 opener 관계가 끊겨, Chrome 은 그 팝업의
 * `popup.closed` 를 (예외가 아니라) `true` 로 돌려준다. 그래서 `.closed` 폴링으로는 로그인 진행
 * 중과 사용자가 닫은 상태를 구분할 수 없다(동의 화면을 거치느라 오래 걸리는 계정이 "취소됨"으로
 * 오판돼 로그인이 조용히 실패한다). `.closed` 를 보지 않고, 응답이 끝내 오지 않을 때만 이 타임아웃으로
 * 종료한다 — 동의·2단계 인증 등으로 오래 걸려도 넉넉하도록 길게 잡는다.
 */
const LOGIN_POPUP_TIMEOUT_MS = 3 * 60 * 1000;

interface GoogleCallbackMessage {
  source: string;
  idToken?: string;
  state?: string;
  error?: string;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  nonce: string;
  state: string;
}): string {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("response_type", "id_token");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("redirect_uri", params.redirectUri);
  // implicit 흐름에서 Google 이 필수로 요구한다(replay 방지).
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("state", params.state);
  // 계정이 하나만 로그인돼 있어도 선택 화면을 띄워, 의도치 않은 계정으로 조용히 로그인되는 걸 막는다.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

function isCallbackMessage(data: unknown): data is GoogleCallbackMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as GoogleCallbackMessage).source === CALLBACK_MESSAGE_SOURCE
  );
}

const KAKAO_AUTH_ENDPOINT = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_CALLBACK_MESSAGE_SOURCE = "promise9-kakao-auth";
const KAKAO_CALLBACK_PATH = "/auth/kakao-callback.html";

interface KakaoCallbackMessage {
  source: string;
  code?: string;
  state?: string;
  error?: string;
}

export function buildKakaoAuthUrl(params: {
  restApiKey: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(KAKAO_AUTH_ENDPOINT);
  url.searchParams.set("client_id", params.restApiKey);
  // 카카오 OIDC 는 code 플로우 고정 — 서버가 code 를 idToken 으로 교환한다.
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid");
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  return url.toString();
}

function isKakaoCallbackMessage(data: unknown): data is KakaoCallbackMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as KakaoCallbackMessage).source === KAKAO_CALLBACK_MESSAGE_SOURCE
  );
}

async function getGoogleIdToken(): Promise<string> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 가 설정되지 않았습니다.");
  }

  const origin = window.location.origin;
  const nonce = randomToken();
  const state = randomToken();
  const url = buildGoogleAuthUrl({
    clientId,
    redirectUri: `${origin}${CALLBACK_PATH}`,
    nonce,
    state,
  });

  // 사용자 클릭 핸들러가 아직 살아 있는 동안 동기적으로 열어야 팝업 차단을 피할 수 있다.
  const popup = window.open(url, "promise9-google-login", POPUP_FEATURES);
  if (!popup) {
    throw new Error("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
  }

  return new Promise<string>((resolve, reject) => {
    // COOP 로 popup.closed 를 신뢰할 수 없어(위 LOGIN_POPUP_TIMEOUT_MS 참고) 취소 감지를
    // 폴링 대신 타임아웃으로 한다. 응답이 오지 않으면 사용자가 닫은 것으로 보고 조용히 종료한다.
    const timeoutTimer = setTimeout(() => {
      cleanup();
      popup?.close();
      reject(new SocialLoginCancelledError());
    }, LOGIN_POPUP_TIMEOUT_MS);

    function cleanup() {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeoutTimer);
    }

    function handleMessage(event: MessageEvent) {
      // 콜백 페이지는 우리 origin 에서 뜬다 — 다른 origin 의 메시지는 신뢰하지 않는다.
      if (event.origin !== origin) return;
      if (!isCallbackMessage(event.data)) return;

      cleanup();
      popup?.close();

      const { idToken, state: returnedState, error } = event.data;
      if (error) {
        reject(new Error(`구글 로그인에 실패했습니다: ${error}`));
        return;
      }
      // state 불일치는 CSRF 의심 상황 — 받은 토큰을 쓰지 않는다.
      if (returnedState !== state) {
        reject(new Error("구글 로그인 응답의 state 가 일치하지 않습니다."));
        return;
      }
      if (!idToken) {
        reject(new Error("구글 로그인 응답에 idToken 이 없습니다."));
        return;
      }
      resolve(idToken);
    }

    window.addEventListener("message", handleMessage);
  });
}

/**
 * 웹 카카오 로그인 — 팝업으로 authorization code 를 받아 서버가 idToken 으로 교환한다.
 *
 * 카카오 OIDC 는 response_type=code 고정이고 code→token 교환에 client_secret 이 필수라
 * 프론트만으로는 idToken 을 못 만든다. 그래서 code 만 회수해 POST /auth/kakao/exchange 로
 * 넘기고(서버가 secret 보관), 돌려받은 idToken 을 그대로 POST /auth/social 에 쓴다.
 * (구글 웹과 팝업/취소 감지 구조는 같고, 콜백이 code 를 query 로 돌려준다는 점만 다르다.)
 */
async function getKakaoIdToken(): Promise<string> {
  const restApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
  if (!restApiKey) {
    throw new Error("EXPO_PUBLIC_KAKAO_REST_API_KEY 가 설정되지 않았습니다.");
  }

  const origin = window.location.origin;
  const redirectUri = `${origin}${KAKAO_CALLBACK_PATH}`;
  const state = randomToken();
  const url = buildKakaoAuthUrl({ restApiKey, redirectUri, state });

  // 사용자 클릭 핸들러가 살아 있는 동안 동기적으로 열어야 팝업 차단을 피할 수 있다.
  const popup = window.open(url, "promise9-kakao-login", POPUP_FEATURES);
  if (!popup) {
    throw new Error("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
  }

  const code = await new Promise<string>((resolve, reject) => {
    // 구글 웹과 동일 — COOP 로 popup.closed 를 신뢰할 수 없어 취소 감지를 타임아웃으로 한다.
    const timeoutTimer = setTimeout(() => {
      cleanup();
      popup?.close();
      reject(new SocialLoginCancelledError());
    }, LOGIN_POPUP_TIMEOUT_MS);

    function cleanup() {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeoutTimer);
    }

    function handleMessage(event: MessageEvent) {
      // 콜백 페이지는 우리 origin 에서 뜬다 — 다른 origin 의 메시지는 신뢰하지 않는다.
      if (event.origin !== origin) return;
      if (!isKakaoCallbackMessage(event.data)) return;

      cleanup();
      popup?.close();

      const { code, state: returnedState, error } = event.data;
      if (error) {
        reject(new Error(`카카오 로그인에 실패했습니다: ${error}`));
        return;
      }
      // state 불일치는 CSRF 의심 — 받은 code 를 쓰지 않는다.
      if (returnedState !== state) {
        reject(new Error("카카오 로그인 응답의 state 가 일치하지 않습니다."));
        return;
      }
      if (!code) {
        reject(new Error("카카오 로그인 응답에 code 가 없습니다."));
        return;
      }
      resolve(code);
    }

    window.addEventListener("message", handleMessage);
  });

  const { data } = await apiClient.post<SuccessResponse<unknown>>(
    "/auth/kakao/exchange",
    { code, redirectUri } satisfies KakaoExchangeRequest,
  );
  return kakaoExchangeResponseSchema.parse(data.data).idToken;
}

/**
 * 웹 애플 로그인 — Apple JS SDK 팝업.
 *
 * `expo-apple-authentication` 은 웹을 지원하지 않는다. 구글처럼 authorize URL 을 직접 열어
 * 정적 콜백으로 받는 방식도 못 쓴다 — name/email scope 를 요청하면 Apple 이
 * `response_mode=form_post` 를 강제하는데 웹은 정적 호스팅이라 POST 를 받을 수 없고, 서버가
 * email 클레임을 요구해 scope 를 뺄 수도 없다. SDK 의 `usePopup` 은 리다이렉트 없이 결과를
 * 프로미스로 돌려주므로 이 경로만 남는다. 토큰 검증은 서버가 한다(audience = Services ID).
 */
const APPLE_SDK_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
/**
 * usePopup 이라 실제 리다이렉트는 없지만 Apple 이 등록된 Return URL 과 대조한다 —
 * Apple Developer 콘솔의 Services ID 에 `https://<웹 도메인>/login` 으로 등록돼 있어야 한다.
 */
const APPLE_REDIRECT_PATH = "/login";

interface AppleSignInResponse {
  authorization: { code: string; id_token: string; state?: string };
}

interface AppleIdSdk {
  auth: {
    init(config: {
      clientId: string;
      redirectURI: string;
      scope: string;
      state: string;
      usePopup: boolean;
    }): void;
    signIn(): Promise<AppleSignInResponse>;
  };
}

declare global {
  interface Window {
    AppleID?: AppleIdSdk;
  }
}

/** 진행 중인 SDK 로드 — 클릭이 겹쳐도 script 태그를 한 번만 꽂는다. 끝나면 비운다(로드 여부는 window.AppleID 가 진실). */
let appleSdkLoading: Promise<void> | null = null;

function loadAppleSdk(): Promise<void> {
  if (window.AppleID) return Promise.resolve();
  if (!appleSdkLoading) {
    appleSdkLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = APPLE_SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("애플 로그인 SDK 를 불러오지 못했습니다."));
      document.head.appendChild(script);
    }).finally(() => {
      appleSdkLoading = null;
    });
  }
  return appleSdkLoading;
}

/** SDK 는 `{ error: "popup_closed_by_user" }` 처럼 코드 하나를 담은 객체로 reject 한다. */
function isAppleSdkError(error: unknown): error is { error: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { error?: unknown }).error === "string"
  );
}

async function getAppleIdToken(): Promise<string> {
  const clientId = process.env.EXPO_PUBLIC_APPLE_SERVICES_ID;
  if (!clientId) {
    throw new Error("EXPO_PUBLIC_APPLE_SERVICES_ID 가 설정되지 않았습니다.");
  }

  // 팝업은 사용자 클릭 태스크 안에서 열려야 차단을 피한다 — SDK 가 이미 있으면 await 없이 바로
  // signIn 까지 간다(훅 마운트 시 미리 받아 두는 이유).
  if (!window.AppleID) await loadAppleSdk();
  const sdk = window.AppleID;
  if (!sdk) throw new Error("애플 로그인 SDK 를 불러오지 못했습니다.");

  const state = randomToken();
  sdk.auth.init({
    clientId,
    redirectURI: `${window.location.origin}${APPLE_REDIRECT_PATH}`,
    scope: "name email",
    state,
    usePopup: true,
  });

  let response: AppleSignInResponse;
  try {
    response = await sdk.auth.signIn();
  } catch (error) {
    if (!isAppleSdkError(error)) throw error;
    // 팝업을 닫거나 Apple 화면에서 취소한 경우 — 실패가 아니므로 화면이 조용히 원복하게 한다.
    if (
      error.error === "popup_closed_by_user" ||
      error.error === "user_cancelled_authorize"
    ) {
      throw new SocialLoginCancelledError();
    }
    if (error.error === "popup_blocked_by_browser") {
      throw new Error("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
    }
    throw new Error(`애플 로그인에 실패했습니다: ${error.error}`);
  }

  const { id_token: idToken, state: returnedState } = response.authorization;
  // state 불일치는 CSRF 의심 — 받은 토큰을 쓰지 않는다.
  if (returnedState !== state) {
    throw new Error("애플 로그인 응답의 state 가 일치하지 않습니다.");
  }
  if (!idToken) {
    throw new Error("애플 로그인 응답에 id_token 이 없습니다.");
  }
  return idToken;
}

export function useSocialAuth() {
  // 애플 SDK 를 미리 받아 둔다 — 클릭 시점에 스크립트를 기다리면 팝업이 사용자 제스처 밖에서 열려
  // 차단될 수 있다.
  useEffect(() => {
    loadAppleSdk().catch(() => {
      // 미리 받기 실패는 여기서 알리지 않는다 — 클릭 시 다시 시도해 그때 에러로 드러난다.
    });
  }, []);

  const getIdToken = useCallback(
    async (provider: SocialProvider): Promise<string> => {
      switch (provider) {
        case "google":
          return getGoogleIdToken();
        case "kakao":
          return getKakaoIdToken();
        case "apple":
          return getAppleIdToken();
      }
    },
    [],
  );

  return { getIdToken };
}
