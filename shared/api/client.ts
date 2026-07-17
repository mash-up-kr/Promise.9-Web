import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ErrorResponse } from "./api.types";
import {
  ApiError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
} from "./errors";

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

  // 임시 인증: 서버 MASTER_ACCESS_TOKEN 우회용. EXPO_PUBLIC_* 는 번들 공개 → 프로덕션 미설정.
  const masterToken = process.env.EXPO_PUBLIC_API_MASTER_TOKEN;
  if (masterToken) {
    config.headers.set("Authorization", `Bearer ${masterToken}`);
  }

  // TODO(#auth 별도 이슈):
  //  1) Access token attach
  //     - 앱·웹: expo-secure-store / 익스텐션: chrome.storage.local
  //     - shared/api/ 에 TokenStorage 인터페이스 두고 표면별 구현 주입
  //     - 예: config.headers.set('Authorization', `Bearer ${await tokenStorage.getAccessToken()}`)
  //  2) 401 응답 시 single-flight refresh 큐
  //     - 동시 요청의 refresh 중복 호출 방지 + 원 요청 재시도

  return config;
};

const handleResponseError = (error: unknown): never => {
  if (!axios.isAxiosError<ErrorResponse>(error)) throw error;
  if (error.code === "ECONNABORTED")
    throw new TimeoutError(undefined, { cause: error });
  if (!error.response) throw new NetworkError(undefined, { cause: error });
  if (error.response.status === 401)
    throw new UnauthorizedError(error.response, { cause: error });
  throw new ApiError(error.response, { cause: error });
};

// UT 전용 브랜치(chore/ut): mock 어댑터가 모든 요청을 가로채므로 baseURL 은 형식상 필요할 뿐이다.
// 배포 CI 에 EXPO_PUBLIC_API_BASE_URL 이 없어도 부팅되도록 폴백을 둔다.
// 실서버 연동으로 되돌릴 때 미설정 throw 로 복구할 것.
const baseURL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mock.local/api/v1";

export const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
});

apiClient.interceptors.request.use(setRequestDefaultHeaders);
apiClient.interceptors.response.use((res) => res, handleResponseError);
