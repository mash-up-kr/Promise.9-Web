import {
  clearTokens,
  getRefreshToken,
  setTokenPersistence,
  setTokens,
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
 * 웹앱은 `return=extension` 을 보고 익스텐션 전용 토큰쌍을 발급해 넘긴다 — 웹에 이미
 * 로그인돼 있으면 소셜 로그인 없이 바로 연결된다.
 */
export async function openWebLogin(): Promise<void> {
  // 지금 탭을 opener 로 지정한다 — 로그인 탭을 닫으면("원래 탭으로 돌아가기") 크롬이
  // 옆 탭이 아니라 opener 탭을 다시 활성화한다.
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  await chrome.tabs.create({
    url: webAppUrl(WEB_APP_PATH.extensionLogin),
    ...(activeTab?.id !== undefined ? { openerTabId: activeTab.id } : {}),
  });
}

/**
 * 웹앱이 넘겨준 토큰쌍으로 이 익스텐션의 세션을 만든다.
 *
 * 웹이 자기 토큰을 복사해 주는 게 아니다 — `POST /auth/extension-token` 이 웹 세션과 **별개의
 * tokenFamily** 로 발급한 쌍이라, 두 표면이 서로 독립적으로 회전·폐기된다(서버가 Refresh Token
 * Rotation 을 쓰므로 같은 리프레시 토큰을 나눠 가지면 한쪽이 갱신하는 순간 다른 쪽이 로그아웃된다).
 */
export async function logInWithTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await setTokens(accessToken, refreshToken);
}

export async function logOut(): Promise<void> {
  await clearTokens();
}
