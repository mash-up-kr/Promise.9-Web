import type { TokenPersistence } from "@shared/api";

// D2(계획서 plan/auth-login-api.md §6) — ATK 는 메모리, RTK 는 웹에서 localStorage 에 저장한다.
// httpOnly 쿠키 전환은 서버 스펙 변경이 필요해 별도 논의 후 이 파일만 교체하면 되도록 감싸둔다.
const REFRESH_TOKEN_KEY = "promise9_refresh_token";

export const tokenPersistence: TokenPersistence = {
  async getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token) {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};
