import {
  type ExtensionLoginMessage,
  extensionLoginMessageSchema,
} from "@shared/extension/extensionLogin.contracts";

import { webAppUrl } from "@/lib/webApp";

import { logInWithTokens } from "./session";

export type HandoffResult = { ok: true } | { ok: false; reason: string };

/**
 * 웹앱 탭이 보낸 로그인 인계 메시지를 처리한다.
 *
 * `onMessageExternal` 은 manifest 의 `externally_connectable` 에 맞는 페이지만 보낼 수 있지만,
 * 그 도메인의 어느 페이지든 보낼 수 있으므로 (1) 보낸 곳이 우리 웹앱 origin 인지,
 * (2) 메시지가 우리 계약 모양인지 둘 다 확인한 뒤에야 토큰쌍을 저장한다 — 토큰쌍은 곧 계정이다.
 */
export async function handleLoginHandoff(
  message: unknown,
  senderUrl: string | undefined,
): Promise<HandoffResult> {
  if (!isFromWebApp(senderUrl)) {
    return { ok: false, reason: "웹앱이 아닌 곳에서 온 메시지" };
  }

  const parsed = extensionLoginMessageSchema.safeParse(message);
  if (!parsed.success) {
    return { ok: false, reason: "알 수 없는 메시지" };
  }

  // 저장(chrome.storage)이 실패해도 반드시 응답한다 — 던지고 말면 sendResponse 가 호출되지
  // 않고, 웹앱 탭은 포트가 닫힐 때까지 "연결 중" 화면에 묶인다.
  try {
    await logInWithTokens(parsed.data.accessToken, parsed.data.refreshToken);
  } catch {
    return { ok: false, reason: "토큰을 저장하지 못함" };
  }

  return { ok: true };
}

function isFromWebApp(senderUrl: string | undefined): boolean {
  if (!senderUrl) return false;

  try {
    return new URL(senderUrl).origin === new URL(webAppUrl("/")).origin;
  } catch {
    return false;
  }
}

export type { ExtensionLoginMessage };
