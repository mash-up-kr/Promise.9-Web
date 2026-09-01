import {
  apiClient,
  extensionTokenResponseSchema,
  getAccessToken,
  refreshAccessToken,
  type SuccessResponse,
} from "@shared/api";
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
 * 이 웹 세션의 계정을 크롬 익스텐션에 연결한다.
 *
 * `POST /auth/extension-token` 으로 익스텐션 전용 토큰쌍(웹 세션과 별개 tokenFamily)을
 * 발급받아 `chrome.runtime.sendMessage` 로 넘긴다 — 웹에 이미 로그인돼 있으면 소셜 로그인을
 * 다시 할 필요가 없다. 실패해도(미설치·네트워크) 웹 세션에는 아무 영향이 없다.
 */
export async function connectExtension(): Promise<boolean> {
  const extensionId = process.env.EXPO_PUBLIC_EXTENSION_ID;
  const sendMessage = (globalThis as ChromeRuntimeLike).chrome?.runtime
    ?.sendMessage;
  // 받을 익스텐션이 없으면(다른 브라우저·미설치) 전달할 수 없는 토큰쌍을 만들지 않는다 — 발급 전에 확인.
  if (!extensionId || !sendMessage) return false;

  try {
    // 액세스 토큰은 메모리 전용이라 익스텐션이 새로 연 탭에는 없다 — 영속 리프레시 토큰으로 먼저
    // 복원한다. (`/auth/*` 는 401 자동 재발급 대상이 아니라 인터셉터가 대신해 주지 않는다.)
    if (!(await getAccessToken())) await refreshAccessToken();

    const { data } = await apiClient.post<SuccessResponse<unknown>>(
      "/auth/extension-token",
    );
    const pair = extensionTokenResponseSchema.parse(data.data);

    const message: ExtensionLoginMessage = {
      source: EXTENSION_LOGIN_MESSAGE_SOURCE,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
    };
    const response = (await sendMessage(extensionId, message)) as
      | { ok?: boolean }
      | undefined;

    return response?.ok === true;
  } catch {
    // 발급 실패(미로그인·네트워크)든 익스텐션 무응답이든 — 호출부엔 연결 실패로만 알린다.
    return false;
  }
}
