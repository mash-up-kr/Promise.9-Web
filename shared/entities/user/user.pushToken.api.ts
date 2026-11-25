import { apiClient } from "@shared/api";

export interface PushTokenRegistration {
  token: string;
  platform: "ios" | "android";
}

// 토큰 기준 upsert — 다시 보내도 중복되지 않고, 다른 계정으로 로그인하면 그 계정에 다시 연결된다(→204).
export async function putPushToken(
  registration: PushTokenRegistration,
): Promise<void> {
  await apiClient.put("/users/me/push-tokens", registration);
}

// 서버가 토큰을 접근 로그 URL 에 남기지 않으려고 본문으로 받는다. 이미 없거나 남의 토큰이어도 204.
export async function deletePushToken(token: string): Promise<void> {
  await apiClient.delete("/users/me/push-tokens", { data: { token } });
}
