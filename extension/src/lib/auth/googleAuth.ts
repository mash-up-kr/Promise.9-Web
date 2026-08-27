const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export class GoogleAuthCancelledError extends Error {
  constructor() {
    super("구글 로그인을 취소했습니다.");
    this.name = "GoogleAuthCancelledError";
  }
}

export interface GoogleAuthUrlParams {
  clientId: string;
  redirectUri: string;
  nonce: string;
  state: string;
}

/**
 * 구글 OIDC implicit 인증 URL.
 *
 * `response_type=id_token` 이라 액세스 토큰은 받지 않는다 — 서버에 넘길 idToken 만 필요하고,
 * client_secret 없이 끝나므로 확장 번들에 비밀값을 넣지 않아도 된다(웹 구현과 같은 이유).
 * 토큰 검증은 서버가 한다.
 */
export function buildGoogleAuthUrl(params: GoogleAuthUrlParams): string {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("response_type", "id_token");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("redirect_uri", params.redirectUri);
  // implicit 흐름에서 구글이 필수로 요구한다(replay 방지).
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("state", params.state);
  // 계정이 하나만 로그인돼 있어도 선택 화면을 띄워, 의도치 않은 계정으로 조용히 로그인되는 걸 막는다.
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

/**
 * launchWebAuthFlow 가 돌려준 redirect URL 에서 idToken 을 꺼낸다.
 *
 * implicit 흐름의 결과는 쿼리가 아니라 **fragment(#)** 로 온다.
 * `state` 가 우리가 보낸 값과 다르면 CSRF 의심 상황이라 토큰을 쓰지 않는다.
 */
export function extractIdToken(redirectUrl: string, state: string): string {
  const fragment = new URL(redirectUrl).hash.slice(1);
  const params = new URLSearchParams(fragment);

  const error = params.get("error");
  if (error) throw new Error(`구글 로그인에 실패했습니다: ${error}`);

  if (params.get("state") !== state) {
    throw new Error("구글 로그인 응답의 state 가 일치하지 않습니다.");
  }

  const idToken = params.get("id_token");
  if (!idToken) throw new Error("구글 로그인 응답에 idToken 이 없습니다.");

  return idToken;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * 구글 계정 선택 창을 띄우고 idToken 을 받아온다.
 *
 * redirect URI 는 `chrome.identity.getRedirectURL()` 이 주는
 * `https://<확장 ID>.chromiumapp.org/` 다. **이 주소를 Google Cloud Console 의 웹 클라이언트
 * "승인된 리디렉션 URI" 에 등록해야** 로그인이 통과한다(등록 전에는 redirect_uri_mismatch).
 */
export async function getGoogleIdToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_GOOGLE_WEB_CLIENT_ID 가 설정되지 않았습니다. extension/.env.local 을 확인하세요.",
    );
  }

  const state = randomToken();
  const url = buildGoogleAuthUrl({
    clientId,
    redirectUri: chrome.identity.getRedirectURL(),
    nonce: randomToken(),
    state,
  });

  let redirectUrl: string | undefined;
  try {
    redirectUrl = await chrome.identity.launchWebAuthFlow({
      url,
      interactive: true,
    });
  } catch {
    // 사용자가 창을 그냥 닫으면 여기로 온다 — 실패가 아니라 취소로 다룬다.
    throw new GoogleAuthCancelledError();
  }

  if (!redirectUrl) throw new GoogleAuthCancelledError();

  return extractIdToken(redirectUrl, state);
}
