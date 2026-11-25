jest.mock("@shared/api", () => ({
  apiClient: { put: jest.fn() },
}));

import { apiClient } from "@shared/api";

import { putPushToken } from "./user.pushToken.api";

beforeEach(() => jest.clearAllMocks());

test("putPushToken 은 PUT /users/me/push-tokens 에 토큰과 플랫폼을 보낸다", async () => {
  jest.mocked(apiClient.put).mockResolvedValue({});
  await putPushToken({ token: "ExpoPushToken[a]", platform: "ios" });
  expect(apiClient.put).toHaveBeenCalledWith("/users/me/push-tokens", {
    token: "ExpoPushToken[a]",
    platform: "ios",
  });
});
