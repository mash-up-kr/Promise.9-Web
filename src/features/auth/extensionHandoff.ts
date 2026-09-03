import {
  apiClient,
  extensionTokenResponseSchema,
  getAccessToken,
  refreshAccessToken,
  type SuccessResponse,
} from "@shared/api";
import { logoutRequest } from "@shared/entities/auth/auth.queries";
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

/**
 * 연결 결과.
 *
 * 실패 사유를 나눠서 알리는 이유: 화면이 할 일이 서로 다르다. `unsupported` 는 재시도해도
 * 소용없으니 평범한 웹 로그인으로 돌려보내고, `unauthenticated` 는 다시 로그인시켜야 하며,
 * `failed`(네트워크·익스텐션 무응답)만 재시도가 의미 있다.
 */
export type ExtensionConnectResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "unauthenticated" | "failed" };

/** 로그인 화면이 `return` 쿼리로 받은 값이 익스텐션에서 온 것인지. */
export function isExtensionReturn(
  value: string | string[] | undefined,
): boolean {
  return value === EXTENSION_LOGIN_RETURN_VALUE;
}

function getSendMessage() {
  return (globalThis as ChromeRuntimeLike).chrome?.runtime?.sendMessage;
}

/**
 * 이 브라우저에서 익스텐션 인계를 시도할 수 있는지.
 *
 * 확장 ID 가 비어 있거나(EXPO_PUBLIC_EXTENSION_ID 미설정) 크롬이 아니면 연결 자체가 성립하지
 * 않는다 — 그때는 인계를 건너뛰고 평범한 웹 로그인으로 진행해야 한다(.env.example 참고).
 */
export function canConnectExtension(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_EXTENSION_ID && getSendMessage());
}

/**
 * 이 웹 세션의 계정을 크롬 익스텐션에 연결한다.
 *
 * `POST /auth/extension-token` 으로 익스텐션 전용 토큰쌍(웹 세션과 별개 tokenFamily)을
 * 발급받아 `chrome.runtime.sendMessage` 로 넘긴다 — 웹에 이미 로그인돼 있으면 소셜 로그인을
 * 다시 할 필요가 없다. 실패해도(미설치·네트워크) 웹 세션에는 아무 영향이 없다.
 */
export async function connectExtension(): Promise<ExtensionConnectResult> {
  const extensionId = process.env.EXPO_PUBLIC_EXTENSION_ID;
  const sendMessage = getSendMessage();
  // 받을 익스텐션이 없으면(다른 브라우저·미설치) 전달할 수 없는 토큰쌍을 만들지 않는다 — 발급 전에 확인.
  if (!extensionId || !sendMessage) return { ok: false, reason: "unsupported" };

  try {
    // 액세스 토큰은 메모리 전용이라 익스텐션이 새로 연 탭에는 없다 — 영속 리프레시 토큰으로 먼저
    // 복원한다. (`/auth/*` 는 401 자동 재발급 대상이 아니라 인터셉터가 대신해 주지 않는다.)
    if (!(await getAccessToken())) await refreshAccessToken();
  } catch {
    // 리프레시 토큰이 만료·폐기됐다 — 재시도해도 같으니 다시 로그인해야 한다.
    return { ok: false, reason: "unauthenticated" };
  }

  let refreshToken: string | null = null;
  try {
    const { data } = await apiClient.post<SuccessResponse<unknown>>(
      "/auth/extension-token",
    );
    const pair = extensionTokenResponseSchema.parse(data.data);
    refreshToken = pair.refreshToken;

    const message: ExtensionLoginMessage = {
      source: EXTENSION_LOGIN_MESSAGE_SOURCE,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
    };
    const response = (await sendMessage(extensionId, message)) as
      | { ok?: boolean }
      | undefined;

    if (response?.ok === true) return { ok: true };
  } catch {
    // 발급 실패(네트워크)든 익스텐션 무응답이든 — 호출부엔 재시도 가능한 실패로만 알린다.
  }

  await revokeUnusedPair(refreshToken);

  return { ok: false, reason: "failed" };
}

/**
 * 발급만 되고 익스텐션에 닿지 못한 토큰쌍을 폐기한다.
 *
 * 그냥 버리면 아무도 쓰지 않는 리프레시 토큰이 만료(30일)까지 서버에 살아 있고, 사용자가
 * '다시 시도' 를 누를 때마다 하나씩 쌓인다.
 */
async function revokeUnusedPair(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;

  try {
    await logoutRequest(refreshToken);
  } catch {
    // 폐기까지 실패해도 사용자에게 알릴 것은 없다 — 만료되면 사라진다.
  }
}
