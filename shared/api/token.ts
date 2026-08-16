/**
 * 액세스 토큰 저장소 (메모리).
 *
 * 로그인·토큰 저장 연동(#auth) 전까지 임시 마스터 토큰(`EXPO_PUBLIC_API_MASTER_TOKEN`,
 * 서버 MASTER_ACCESS_TOKEN 과 동일)을 초기값으로 시드한다. 정식 구현 시 로그인 성공 콜백이
 * `setAccessToken` 을 호출하고, surface 별 영속 저장소(앱·웹 expo-secure-store /
 * 익스텐션 chrome.storage.local)로 교체한다.
 *
 * `getAccessToken` 이 async 인 이유: secure-store 등 비동기 저장소로 교체해도 호출부가 바뀌지 않도록.
 */
let accessToken: string | null =
  process.env.EXPO_PUBLIC_API_MASTER_TOKEN ?? null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getAccessToken(): Promise<string | null> {
  return accessToken;
}

/**
 * 리프레시 토큰 영속 저장소 인터페이스.
 *
 * 이 파일은 순수 TS 라 SecureStore/DOM 을 직접 참조할 수 없다 — 표면별 구현(`src/lib/tokenStorage`,
 * `.web.ts`)을 `setTokenPersistence` 로 주입받는다. 액세스 토큰은 수명이 짧아(15m) 항상 메모리에만
 * 두고, 재발급에 쓰는 리프레시 토큰만 영속 저장한다.
 */
export interface TokenPersistence {
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string | null): Promise<void>;
}

let persistence: TokenPersistence | null = null;

export function setTokenPersistence(impl: TokenPersistence | null): void {
  persistence = impl;
}

export async function getRefreshToken(): Promise<string | null> {
  if (!persistence) return null;
  return persistence.getRefreshToken();
}

// 로그인·재발급(RTR) 성공 시 호출 — accessToken 은 메모리에, refreshToken 은 주입된 저장소에 반영.
// refreshToken 영속 저장을 먼저 끝낸 뒤 accessToken 을 갱신한다 — 저장 I/O 가 실패하면
// 아무것도 바꾸지 않고 에러를 전파해, 메모리(ATK)와 저장소(RTK)가 어긋나는 걸 막는다.
export async function setTokens(
  newAccessToken: string,
  newRefreshToken: string,
): Promise<void> {
  await persistence?.setRefreshToken(newRefreshToken);
  accessToken = newAccessToken;
}

// 로그아웃·탈퇴·재발급 실패 시 호출.
export async function clearTokens(): Promise<void> {
  accessToken = null;
  await persistence?.setRefreshToken(null);
}
