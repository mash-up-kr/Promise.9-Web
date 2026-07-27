import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

// client.ts 는 로드 시 EXPO_PUBLIC_API_BASE_URL 없으면 throw → 케이스마다 env 세팅 후 새로 require.
const ORIGINAL_ENV = process.env;

function loadInterceptor(masterToken?: string) {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_API_BASE_URL: "https://api.test",
  };
  if (masterToken === undefined) {
    delete process.env.EXPO_PUBLIC_API_MASTER_TOKEN;
  } else {
    process.env.EXPO_PUBLIC_API_MASTER_TOKEN = masterToken;
  }

  return (require("./client") as typeof import("./client"))
    .setRequestDefaultHeaders;
}

function makeConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("apiClient 요청 인터셉터 — 마스터 토큰", () => {
  test("EXPO_PUBLIC_API_MASTER_TOKEN 이 있으면 Authorization: Bearer 를 부착한다", async () => {
    const setHeaders = loadInterceptor("promise9");
    const config = await setHeaders(makeConfig());
    expect(config.headers.get("Authorization")).toBe("Bearer promise9");
  });

  test("마스터 토큰이 없으면 Authorization 을 부착하지 않는다", async () => {
    const setHeaders = loadInterceptor(undefined);
    const config = await setHeaders(makeConfig());
    expect(config.headers.has("Authorization")).toBe(false);
  });
});
