/**
 * 액세스 토큰 저장소 (메모리).
 *
 * 로그인(`setTokens`)·재발급(`refreshAccessToken`)이 값을 채운다. 초기값은 항상 `null` —
 * 예전엔 마스터 토큰(`EXPO_PUBLIC_API_MASTER_TOKEN`)을 시드했으나, 메모리 ATK 가 없을 때
 * 앱이 조용히 마스터 계정으로 인증되는 누수(리로드 후 실유저 세션이 마스터로 뒤바뀜)가 있어 제거했다.
 * 부팅 후 ATK 가 없으면 첫 보호 요청이 401 → refresh 인터셉터가 영속 RTK 로 실 세션을 복원한다.
 *
 * `getAccessToken` 이 async 인 이유: secure-store 등 비동기 저장소로 교체해도 호출부가 바뀌지 않도록.
 */
let accessToken: string | null = null;

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
  /**
   * 재발급을 실행 컨텍스트 사이에서 직렬화한다(구현하지 않아도 된다).
   *
   * 익스텐션은 사이드패널과 service worker 가 각각 다른 문서로 돌면서 이 저장소 하나를
   * 공유한다. 재발급 쪽의 모듈 변수는 자기 문서 안에서만 유효하므로, 둘이 동시에 같은
   * 리프레시 토큰으로 재발급하면 RTR 이 뒤늦은 쪽을 재사용으로 거부하고 — 그 실패가
   * `clearTokens` 로 이어져 방금 회전된 토큰까지 지워 양쪽이 로그아웃된다.
   *
   * 앱·웹은 컨텍스트가 하나뿐이라 구현하지 않는다.
   */
  runExclusive?<T>(run: () => Promise<T>): Promise<T>;
}

let persistence: TokenPersistence | null = null;

export function setTokenPersistence(impl: TokenPersistence | null): void {
  persistence = impl;
}

export async function getRefreshToken(): Promise<string | null> {
  if (!persistence) return null;
  return persistence.getRefreshToken();
}

// 저장소가 배타 실행을 제공하면 그 안에서, 아니면 그냥 실행한다(TokenPersistence.runExclusive).
export function runExclusive<T>(run: () => Promise<T>): Promise<T> {
  if (!persistence?.runExclusive) return run();
  return persistence.runExclusive(run);
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
