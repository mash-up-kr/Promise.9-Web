import axios, { type AxiosInstance } from "axios";

import type { SuccessResponse } from "./api.types";
import { refreshResponseSchema } from "./auth.contracts";
import { clearTokens, getRefreshToken, runExclusive, setTokens } from "./token";

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

// 401 재발급. 같은 문서 안의 동시 호출은 진행 중인 하나를 공유하고, 다른 문서와는
// `runExclusive` 로 직렬화한다(둘 다 없으면 RTR 이 뒤늦은 재발급을 재사용으로 거부한다).
export function refreshAccessToken(): Promise<string> {
  inFlight ??= runExclusive(doRefresh).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

// 리프레시 토큰은 반드시 배타 구간 **안에서** 읽는다 — 기다리는 동안 다른 문서가 회전시켰다면
// 그 새 토큰을 읽어야 한다.
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
