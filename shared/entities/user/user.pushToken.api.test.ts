jest.mock("@shared/api", () => ({
  apiClient: { put: jest.fn(), delete: jest.fn() },
}));

import { apiClient } from "@shared/api";

import { deletePushToken, putPushToken } from "./user.pushToken.api";

beforeEach(() => jest.clearAllMocks());

test("putPushToken 은 PUT /users/me/push-tokens 에 토큰과 플랫폼을 보낸다", async () => {
  jest.mocked(apiClient.put).mockResolvedValue({});
  await putPushToken({ token: "ExpoPushToken[a]", platform: "ios" });
  expect(apiClient.put).toHaveBeenCalledWith("/users/me/push-tokens", {
    token: "ExpoPushToken[a]",
    platform: "ios",
  });
});

// 토큰이 접근 로그 URL 에 남지 않게 서버가 본문으로 받는다.
test("deletePushToken 은 DELETE /users/me/push-tokens 본문에 토큰을 보낸다", async () => {
  jest.mocked(apiClient.delete).mockResolvedValue({});
  await deletePushToken("ExpoPushToken[a]");
  expect(apiClient.delete).toHaveBeenCalledWith("/users/me/push-tokens", {
    data: { token: "ExpoPushToken[a]" },
  });
});
