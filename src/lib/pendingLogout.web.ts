import { logoutRequest } from "@shared/entities/auth/auth.queries";

import type { LogoutRequest } from "./pendingLogout";

// 웹에는 푸시 토큰도 재시도할 보안 저장소도 없다 — 한 번만 보내고, 실패한 세션은 만료되면 사라진다.

export type { LogoutRequest };

export async function sendLogout({
  refreshToken,
}: LogoutRequest): Promise<void> {
  await logoutRequest(refreshToken).catch(() =>
    console.warn("[logout] 서버 로그아웃 실패"),
  );
}

export async function flushPendingLogout(): Promise<void> {}
