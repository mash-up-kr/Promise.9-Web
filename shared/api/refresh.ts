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
    // 서버가 토큰을 거절했을 때만 지운다 — 네트워크·타임아웃·5xx 같은 일시 장애로 세션을 날리지 않도록
    // (공유 익스텐션은 매 실행마다 refresh 를 거치므로 그 영향이 메인 앱까지 미친다).
    if (isTokenRejected(error)) {
      await clearTokens();
    }
    throw error;
  }
}

function isTokenRejected(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}
