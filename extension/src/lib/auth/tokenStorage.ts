import type { TokenPersistence } from "@shared/api";

const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * 리프레시 토큰 저장소 — `chrome.storage.local`.
 *
 * 앱은 expo-secure-store, 웹은 각자 저장소를 쓰고 익스텐션은 여기를 쓴다
 * (`shared/api/token.ts` 의 `setTokenPersistence` 로 주입).
 *
 * 액세스 토큰은 수명이 짧아 메모리에만 둔다 — 다만 service worker 는 유휴 시 종료되면서
 * 그 메모리가 날아가므로, 다시 뜬 뒤 첫 요청이 401 → refresh 로 복원된다.
 */
export const chromeTokenPersistence: TokenPersistence = {
  async getRefreshToken() {
    const stored = await chrome.storage.local.get(REFRESH_TOKEN_KEY);

    return (stored[REFRESH_TOKEN_KEY] as string | undefined) ?? null;
  },

  async setRefreshToken(token) {
    if (token === null) {
      await chrome.storage.local.remove(REFRESH_TOKEN_KEY);
      return;
    }

    await chrome.storage.local.set({ [REFRESH_TOKEN_KEY]: token });
  },
};
