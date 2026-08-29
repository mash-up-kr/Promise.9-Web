import {
  apiClient,
  clearTokens,
  getRefreshToken,
  type SocialProvider,
  type SuccessResponse,
  setTokenPersistence,
  setTokens,
  socialLoginResponseSchema,
} from "@shared/api";

import { WEB_APP_PATH, webAppUrl } from "@/lib/webApp";

import { chromeTokenPersistence, subscribeRefreshToken } from "./tokenStorage";

/**
 * 토큰 저장소를 익스텐션 구현으로 갈아끼운다.
 *
 * `shared/api` 는 순수 TS 라 `chrome.*` 를 직접 참조할 수 없어서, 실행 표면이 주입해준다.
 * API 를 부르는 모든 진입점(패널·background)이 시작하자마자 한 번씩 호출해야 한다.
 */
export function installTokenPersistence(): void {
  setTokenPersistence(chromeTokenPersistence);
}

/**
 * 로그인 여부 — 리프레시 토큰이 남아 있으면 로그인된 것으로 본다.
 *
 * 액세스 토큰은 메모리라 패널을 열 때마다 비어 있다. 보호 요청이 401 이면 인터셉터가
 * 리프레시 토큰으로 되살리므로, 화면 판단 기준은 리프레시 토큰의 존재다.
 */
export async function isLoggedIn(): Promise<boolean> {
  return (await getRefreshToken()) !== null;
}

/**
 * 로그인 상태 변화를 구독한다.
 *
 * 로그인은 이 패널이 아니라 **웹앱 탭 → background** 경로로 끝나므로, 패널은 자기가 시작한
 * 일의 결과를 콜백으로 받을 수 없다. 저장소에 리프레시 토큰이 생기는 걸 보고 알아챈다.
 */
export function subscribeLoggedIn(
  onChange: (loggedIn: boolean) => void,
): () => void {
  return subscribeRefreshToken((token) => onChange(token !== null));
}

/**
 * 웹앱 로그인 페이지를 새 탭으로 연다.
 *
 * 익스텐션 안에 로그인 UI 를 두지 않는다 — 웹에 이미 있는 소셜 로그인(구글, 이후 카카오)을
 * 그대로 쓰고, 사용자는 익숙한 주소창을 보며 로그인한다(Pocket·Instapaper·Raindrop 과 같은 방식).
 * 웹앱은 `return=extension` 을 보고 로그인 결과(idToken)를 이 익스텐션에 넘긴다.
 */
export async function openWebLogin(): Promise<void> {
  await chrome.tabs.create({ url: webAppUrl(WEB_APP_PATH.extensionLogin) });
}

/**
 * 웹앱이 넘겨준 idToken 으로 이 익스텐션의 세션을 만든다.
 *
 * 웹이 발급받은 토큰을 복사하지 않고 `POST /auth/social` 을 다시 부르는 이유: 서버가
 * Refresh Token Rotation 을 쓰므로 같은 리프레시 토큰을 두 표면이 나눠 가지면 한쪽이 갱신하는
 * 순간 다른 쪽이 로그아웃된다. 서버는 idToken 을 무상태로 검증하고 호출마다 새 토큰 family 를
 * 발급하므로 같은 idToken 으로 두 번 로그인해도 서로 독립이다.
 */
export async function logInWithIdToken(
  provider: SocialProvider,
  idToken: string,
): Promise<void> {
  const { data } = await apiClient.post<SuccessResponse<unknown>>(
    "/auth/social",
    { provider, idToken },
  );
  const parsed = socialLoginResponseSchema.parse(data.data);

  await setTokens(parsed.accessToken, parsed.refreshToken);
}

export async function logOut(): Promise<void> {
  await clearTokens();
}
