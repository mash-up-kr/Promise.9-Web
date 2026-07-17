import type { AxiosInstance } from "axios";

const ORIGINAL_ENV = process.env;

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

test("installMocks 후 apiClient 요청이 mock 으로 응답한다", async () => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_API_BASE_URL: "https://api.test/api/v1",
  };
  const { installMocks } = require("./setup") as typeof import("./setup");
  installMocks();
  const apiClient = (require("@shared/api") as typeof import("@shared/api"))
    .apiClient as AxiosInstance;
  const { data } = await apiClient.get("/links");
  expect(data.success).toBe(true);
});
