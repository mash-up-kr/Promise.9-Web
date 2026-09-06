import {
  EXTENSION_LOGIN_RETURN_PARAM,
  EXTENSION_LOGIN_RETURN_VALUE,
} from "@shared/extension/extensionLogin.contracts";

/** 배포된 웹앱. 스테이징 등을 볼 때만 `VITE_WEB_APP_BASE_URL` 로 덮어쓴다. */
const DEFAULT_BASE_URL = "https://link-ding-dong.com";

/**
 * 웹앱 경로 — expo-router 라우트(`src/app/`)와 짝이 맞아야 한다.
 *
 * 앱의 `ROUTES`/`linkDetailHref` 는 expo-router `Href` 객체라 그대로 못 쓴다(모양이 다르다).
 * 라우트가 바뀌면 여기도 같이 고쳐야 하는 지점.
 */
export const WEB_APP_PATH = {
  home: "/",
  /** `src/app/link/[id].tsx` */
  linkDetail: (linkId: number) => `/link/${linkId}`,
  /**
   * `src/app/(auth)/login.tsx` — `return=extension` 이 있으면 웹앱이 로그인 결과를
   * 이 익스텐션에 넘긴다(shared/extension/extensionLogin.contracts).
   */
  extensionLogin: `/login?${EXTENSION_LOGIN_RETURN_PARAM}=${EXTENSION_LOGIN_RETURN_VALUE}`,
} as const;

export function webAppUrl(path: string): string {
  const base = import.meta.env.VITE_WEB_APP_BASE_URL || DEFAULT_BASE_URL;

  return new URL(path, base).toString();
}
