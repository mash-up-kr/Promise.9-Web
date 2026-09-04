import type { TokenPersistence } from "@shared/api";

import { createStorageEntry } from "@/lib/chromeStorage";

/**
 * 리프레시 토큰 저장소 — `chrome.storage.local`.
 *
 * 앱은 expo-secure-store, 웹은 각자 저장소를 쓰고 익스텐션은 여기를 쓴다
 * (`shared/api/token.ts` 의 `setTokenPersistence` 로 주입).
 *
 * 액세스 토큰은 수명이 짧아 메모리에만 둔다 — 다만 service worker 는 유휴 시 종료되면서
 * 그 메모리가 날아가므로, 다시 뜬 뒤 첫 요청이 401 → refresh 로 복원된다.
 */
const refreshToken = createStorageEntry<string>("local", "refreshToken");

/**
 * 재발급 직렬화에 쓰는 락 이름.
 *
 * Web Locks 는 같은 origin 의 모든 문서가 공유하므로 패널과 service worker 가 같은 락을 본다.
 * 자바스크립트 변수로는 두 문서를 가로질러 막을 수 없다.
 */
const REFRESH_LOCK_NAME = "promise9-token-refresh";

export const chromeTokenPersistence: TokenPersistence = {
  getRefreshToken: () => refreshToken.read(),

  setRefreshToken: (token) =>
    token === null ? refreshToken.clear() : refreshToken.write(token),

  runExclusive: (run) => navigator.locks.request(REFRESH_LOCK_NAME, run),
};

/**
 * 리프레시 토큰 변경을 구독한다.
 *
 * 로그인은 background 에서 끝나고 패널은 다른 문서라, 같은 저장소를 보는 것으로만 알 수 있다.
 */
export function subscribeRefreshToken(
  onChange: (token: string | null) => void,
): () => void {
  return refreshToken.subscribe(onChange);
}
