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
