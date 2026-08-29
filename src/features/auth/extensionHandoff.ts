import type { SocialProvider } from "@shared/api";
import {
  EXTENSION_LOGIN_MESSAGE_SOURCE,
  EXTENSION_LOGIN_RETURN_VALUE,
  type ExtensionLoginMessage,
} from "@shared/extension/extensionLogin.contracts";

/**
 * `chrome.runtime.sendMessage` 중 우리가 쓰는 부분.
 *
 * 웹앱은 `@types/chrome` 을 두지 않는다(익스텐션 전용 의존). 이 전역은 익스텐션 manifest 의
 * `externally_connectable` 에 우리 도메인이 있을 때만, 그것도 크롬에서만 존재한다.
 */
interface ChromeRuntimeLike {
  chrome?: {
    runtime?: {
      sendMessage?: (extensionId: string, message: unknown) => Promise<unknown>;
    };
  };
}

/** 로그인 화면이 `return` 쿼리로 받은 값이 익스텐션에서 온 것인지. */
export function isExtensionReturn(
  value: string | string[] | undefined,
): boolean {
  return value === EXTENSION_LOGIN_RETURN_VALUE;
}

/**
 * 소셜 로그인으로 받은 idToken 을 크롬 익스텐션에 넘긴다.
 *
 * 익스텐션은 자체 로그인 UI 없이 이 페이지를 `?return=extension` 으로 연다. 웹은 평소처럼
 * 자기 로그인을 진행하면서, 같은 idToken 을 익스텐션에도 건네 익스텐션이 **자기 토큰 쌍**을
 * 발급받게 한다(리프레시 토큰을 복사해 주면 RTR 때문에 한쪽이 로그아웃된다).
 *
 * 익스텐션이 없거나(다른 브라우저, 미설치) ID 가 다르면 조용히 실패한다 — 웹 로그인과 무관하다.
 */
export async function sendIdTokenToExtension(payload: {
  provider: SocialProvider;
  idToken: string;
}): Promise<boolean> {
  const extensionId = process.env.EXPO_PUBLIC_EXTENSION_ID;
  const sendMessage = (globalThis as ChromeRuntimeLike).chrome?.runtime
    ?.sendMessage;
  if (!extensionId || !sendMessage) return false;

  const message: ExtensionLoginMessage = {
    source: EXTENSION_LOGIN_MESSAGE_SOURCE,
    ...payload,
  };

  try {
    const response = (await sendMessage(extensionId, message)) as
      | { ok?: boolean }
      | undefined;

    return response?.ok === true;
  } catch {
    // 익스텐션이 응답하지 않는 경우(미설치·비활성). 웹 로그인에는 영향이 없어야 한다.
    return false;
  }
}
