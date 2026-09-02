import axios, { type AxiosInstance } from "axios";

import type { SuccessResponse } from "./api.types";
import { refreshResponseSchema } from "./auth.contracts";
import { clearTokens, getRefreshToken, setTokens } from "./token";

// 인터셉터 없는 별도 인스턴스 — 재발급 요청 자체가 401 refresh 루프를 트리거하지 않도록 한다.
// 최초 호출 시 지연 생성한다(모듈 로드 시점 부작용 제거).
let authClient: AxiosInstance | null = null;
function getAuthClient(): AxiosInstance {
  authClient ??= axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
    timeout: 10_000,
  });
  return authClient;
}

let inFlight: Promise<string> | null = null;

// 401 재발급. 동시 호출은 진행 중인 하나를 공유한다(중복 재발급·RTR 경합 방지).
export function refreshAccessToken(): Promise<string> {
  inFlight ??= doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearTokens();
    throw new Error("리프레시 토큰이 없어 재발급할 수 없습니다.");
  }
  try {
    const { data } = await getAuthClient().post<SuccessResponse<unknown>>(
      "/auth/refresh",
      { refreshToken },
    );
    const parsed = refreshResponseSchema.parse(data.data);
    await setTokens(parsed.accessToken, parsed.refreshToken);
    return parsed.accessToken;
  } catch (error) {
    await clearTokens();
    throw error;
  }
}
