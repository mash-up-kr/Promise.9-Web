import { useCallback } from "react";

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
/** 사용자가 팝업을 그냥 닫은 걸 감지하는 주기(ms). */
const POPUP_CLOSED_POLL_MS = 400;

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
    const closedTimer = setInterval(() => {
      // COOP(Cross-Origin-Opener-Policy)가 켜진 환경에선 popup.closed 접근이 막힌다.
      // 그 경우 취소 감지는 포기하고 postMessage 결과만 기다린다 — 성공한 로그인을
      // "취소됨"으로 잘못 끝내는 것보다 낫다.
      let isClosed: boolean;
      try {
        isClosed = popup.closed;
      } catch {
        clearInterval(closedTimer);
        return;
      }
      if (!isClosed) return;
      cleanup();
      reject(new SocialLoginCancelledError());
    }, POPUP_CLOSED_POLL_MS);

    function cleanup() {
      window.removeEventListener("message", handleMessage);
      clearInterval(closedTimer);
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
 * 웹에서는 카카오 idToken 을 프론트만으로 발급받을 방법이 없다(서버 미구현과는 별개의,
 * 구조적인 제약).
 *
 * 카카오 OIDC 는 `response_type` 이 `code` 로 고정이고, idToken 은 그 code 를
 * token endpoint 에서 교환할 때만 발급된다 — 이 교환에는 client_secret 이 필수다
 * (카카오는 기본적으로 REST API 키에 client secret 을 강제한다). client_secret 을
 * 프론트 번들(`EXPO_PUBLIC_*`)에 넣으면 그대로 공개되므로, 서버가 code→token 교환을
 * 대신해주는 프록시 엔드포인트 없이는 웹에서 카카오 로그인이 불가능하다.
 * (네이티브는 `@react-native-seoul/kakao-login` SDK 가 이 과정을 내부적으로 처리해
 * client_secret 노출 없이 idToken 을 돌려준다 — useSocialAuth.ts 참고.)
 */
async function getKakaoIdToken(): Promise<string> {
  throw new Error(
    "카카오 웹 로그인은 아직 지원하지 않습니다. (서버의 code-exchange 프록시가 필요합니다)",
  );
}

export function useSocialAuth() {
  const getIdToken = useCallback(
    async (provider: SocialProvider): Promise<string> => {
      switch (provider) {
        case "google":
          return getGoogleIdToken();
        case "kakao":
          return getKakaoIdToken();
      }
    },
    [],
  );

  return { getIdToken };
}
