import { z } from "zod";

import { socialProviderSchema } from "../api/auth.contracts";

/**
 * 웹앱 → 크롬 익스텐션 로그인 인계 메시지.
 *
 * 익스텐션은 자체 로그인 UI 없이 웹앱(`/login?return=extension`)으로 보낸다. 웹앱이 소셜
 * 로그인으로 idToken 을 받으면 `chrome.runtime.sendMessage(확장ID, 이 메시지)` 로 넘기고,
 * 익스텐션은 그 idToken 으로 `POST /auth/social` 을 호출해 **자기 토큰 쌍**을 받는다.
 *
 * 웹의 리프레시 토큰을 복사해 주지 않는 이유: 서버가 Refresh Token Rotation 을 쓰므로
 * 같은 토큰을 두 표면이 나눠 가지면 한쪽이 갱신하는 순간 다른 쪽이 로그아웃된다.
 *
 * 양쪽(웹 `src/features/auth`, 익스텐션 `extension/src/background`)이 이 파일 하나를 import 한다.
 */
export const EXTENSION_LOGIN_MESSAGE_SOURCE = "promise9-extension-login";

export const extensionLoginMessageSchema = z.object({
  source: z.literal(EXTENSION_LOGIN_MESSAGE_SOURCE),
  provider: socialProviderSchema,
  idToken: z.string().min(1),
});

export type ExtensionLoginMessage = z.infer<typeof extensionLoginMessageSchema>;

/** 익스텐션이 웹앱을 열 때 붙이는 쿼리 — 웹앱은 이게 있을 때만 인계를 시도한다. */
export const EXTENSION_LOGIN_RETURN_PARAM = "return";
export const EXTENSION_LOGIN_RETURN_VALUE = "extension";
