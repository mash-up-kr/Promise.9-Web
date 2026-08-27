import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

// client.ts 는 로드 시 EXPO_PUBLIC_API_BASE_URL 없으면 throw → 케이스마다 env 세팅 후 새로 require.
const ORIGINAL_ENV = process.env;

// 케이스마다 새 모듈 인스턴스를 로드하고, 같은 인스턴스의 setAccessToken 으로 메모리 토큰을 세팅한다.
function loadFresh() {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_API_BASE_URL: "https://api.test",
  };
  const { setRequestDefaultHeaders } =
    require("./client") as typeof import("./client");
  const { setAccessToken } = require("./token") as typeof import("./token");
  return { setRequestDefaultHeaders, setAccessToken };
}

function makeConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("apiClient 요청 인터셉터 — 액세스 토큰", () => {
  test("메모리 액세스 토큰이 있으면 Authorization: Bearer 를 부착한다", async () => {
    const { setRequestDefaultHeaders, setAccessToken } = loadFresh();
    setAccessToken("atk-123");
    const config = await setRequestDefaultHeaders(makeConfig());
    expect(config.headers.get("Authorization")).toBe("Bearer atk-123");
  });

  test("액세스 토큰이 없으면 Authorization 을 부착하지 않는다", async () => {
    const { setRequestDefaultHeaders } = loadFresh();
    const config = await setRequestDefaultHeaders(makeConfig());
    expect(config.headers.has("Authorization")).toBe(false);
  });
});
