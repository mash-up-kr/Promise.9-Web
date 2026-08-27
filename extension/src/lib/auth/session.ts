import {
  apiClient,
  clearTokens,
  getRefreshToken,
  type SuccessResponse,
  setTokenPersistence,
  setTokens,
  socialLoginResponseSchema,
} from "@shared/api";

import { getGoogleIdToken } from "./googleAuth";
import { chromeTokenPersistence } from "./tokenStorage";

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

/** 구글 계정으로 로그인하고 발급된 토큰을 저장한다. */
export async function logInWithGoogle(): Promise<void> {
  const idToken = await getGoogleIdToken();

  const { data } = await apiClient.post<SuccessResponse<unknown>>(
    "/auth/social",
    { provider: "google", idToken },
  );
  const parsed = socialLoginResponseSchema.parse(data.data);

  await setTokens(parsed.accessToken, parsed.refreshToken);
}

export async function logOut(): Promise<void> {
  await clearTokens();
}
