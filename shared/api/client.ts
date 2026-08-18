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

  // 액세스 토큰 부착 — 출처는 메모리 저장소(로그인·재발급이 채움). 없으면 헤더를 안 붙인다
  // (보호 엔드포인트는 401 → 응답 인터셉터가 refresh 로 복원).
  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

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
