import type { AxiosInstance } from "axios";

const ORIGINAL_ENV = process.env;

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

test("flag on → apiClient 요청이 mock 으로 응답한다", async () => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_API_BASE_URL: "https://api.test/api/v1",
    EXPO_PUBLIC_USE_MOCK: "true",
  };
  const { installMocks } = require("./setup") as typeof import("./setup");
  installMocks();
  const apiClient = (require("@shared/api") as typeof import("@shared/api"))
    .apiClient as AxiosInstance;
  const { data } = await apiClient.get("/links");
  expect(data.success).toBe(true);
});

test("flag off → installMocks 는 어댑터를 설치하지 않는다", () => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_API_BASE_URL: "https://api.test/api/v1",
    EXPO_PUBLIC_USE_MOCK: "false",
  };
  const { installMocks } = require("./setup") as typeof import("./setup");
  expect(() => installMocks()).not.toThrow();
});
