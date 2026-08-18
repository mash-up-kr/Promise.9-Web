// resetModules 후에도 같은 참조를 유지하도록 mock fn 을 모듈 밖에 둔다.
const mockRefresh = jest.fn();
jest.mock("./refresh", () => ({ refreshAccessToken: mockRefresh }));

import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const ORIGINAL_ENV = process.env;
function loadClient() {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_API_BASE_URL: "https://api.test",
  };
  return require("./client") as typeof import("./client");
}

beforeEach(() => mockRefresh.mockReset());
afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

function make401(url: string, retried = false) {
  return {
    isAxiosError: true,
    config: { url, headers: new AxiosHeaders(), _retry: retried },
    response: { status: 401, data: {} },
  };
}

test("401 이면 재발급 후 새 토큰으로 원요청을 재시도한다", async () => {
  mockRefresh.mockResolvedValue("atk-new");
  const client = loadClient();
  const retry = jest
    .spyOn(client.apiClient, "request")
    .mockResolvedValue({ data: "ok" } as never);

  const result = await client.handleResponseError(make401("/folders"));

  expect(mockRefresh).toHaveBeenCalledTimes(1);
  const retried = retry.mock.calls[0]?.[0] as InternalAxiosRequestConfig;
  expect(retried.headers.get("Authorization")).toBe("Bearer atk-new");
  expect(result).toEqual({ data: "ok" });
});

test("이미 재시도한 요청(_retry)은 다시 재발급하지 않고 던진다", async () => {
  const client = loadClient();
  await expect(
    client.handleResponseError(make401("/folders", true)),
  ).rejects.toBeTruthy();
  expect(mockRefresh).not.toHaveBeenCalled();
});

test("/auth/* 요청의 401 은 재발급하지 않는다", async () => {
  const client = loadClient();
  await expect(
    client.handleResponseError(make401("/auth/logout")),
  ).rejects.toBeTruthy();
  expect(mockRefresh).not.toHaveBeenCalled();
});
