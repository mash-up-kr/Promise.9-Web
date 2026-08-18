import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ErrorResponse } from "./api.types";
import {
  ApiError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
} from "./errors";
import { refreshAccessToken } from "./refresh";
import { getAccessToken } from "./token";

export const setRequestDefaultHeaders = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  // FormData 전송 시 axios 가 boundary 포함 multipart Content-Type 을 자동 설정하므로,
  // 우리가 'application/json' 으로 덮으면 boundary 가 사라져 서버 파싱 실패한다.
  // FormData 가 아닐 때만 명시.
  if (!(config.data instanceof FormData)) {
    config.headers.set("Content-Type", "application/json");
  }
  config.headers.set("Accept", "application/json");

  // 액세스 토큰 부착. 현재 출처는 임시 마스터 토큰 env 시드(shared/api/token) — 정식 저장소·주입은 #auth.
  // EXPO_PUBLIC_* 는 번들에 그대로 노출되므로 프로덕션에는 설정하지 않는다.
  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // TODO(#auth 별도 이슈):
  //  1) 토큰 저장소를 surface 별 영속 구현으로 교체 (앱·웹 expo-secure-store / 익스텐션 chrome.storage.local)
  //  2) 401 응답 시 single-flight refresh 큐
  //     - 동시 요청의 refresh 중복 호출 방지 + 원 요청 재시도

  return config;
};

// 원요청에 재시도 플래그를 달기 위한 확장 config 타입.
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// /auth/social·/auth/refresh·/auth/logout 등은 refresh 로 풀 수 없는 401 → 재시도 제외.
function isAuthEndpoint(url?: string): boolean {
  return url?.startsWith("/auth/") ?? false;
}

export const handleResponseError = async (error: unknown): Promise<unknown> => {
  if (!axios.isAxiosError<ErrorResponse>(error)) throw error;

  // 401 이고 재시도 이력이 없으며 auth 엔드포인트가 아니면 → 재발급 후 원요청 1회 재시도.
  const original = error.config as RetriableConfig | undefined;
  if (
    error.response?.status === 401 &&
    original &&
    !original._retry &&
    !isAuthEndpoint(original.url)
  ) {
    original._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      original.headers.set("Authorization", `Bearer ${accessToken}`);
      return apiClient.request(original);
    } catch {
      // 재발급 실패 → 아래 기존 매핑으로 떨어져 UnauthorizedError 로 전파.
    }
  }

  if (error.code === "ECONNABORTED")
    throw new TimeoutError(undefined, { cause: error });
  if (!error.response) throw new NetworkError(undefined, { cause: error });
  if (error.response.status === 401)
    throw new UnauthorizedError(error.response, { cause: error });
  throw new ApiError(error.response, { cause: error });
};

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!baseURL) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL is not set. Define it in your .env file.",
  );
}

export const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
});

apiClient.interceptors.request.use(setRequestDefaultHeaders);
apiClient.interceptors.response.use((res) => res, handleResponseError);
