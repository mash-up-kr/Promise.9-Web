jest.mock("@shared/api", () => ({
  apiClient: { post: jest.fn(), delete: jest.fn() },
}));

import { apiClient } from "@shared/api";

import { logoutRequest, withdrawRequest } from "./auth.queries";

const mockPost = apiClient.post as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

test("logoutRequest 는 POST /auth/logout 에 refreshToken 을 보낸다", async () => {
  mockPost.mockResolvedValue({});
  await logoutRequest("rtk-1");
  expect(mockPost).toHaveBeenCalledWith("/auth/logout", {
    refreshToken: "rtk-1",
  });
});

// 서버가 리프레시 토큰의 회원과 이 토큰을 함께 조건으로 지운다(서버 #158).
test("logoutRequest 는 이 기기의 푸시 토큰을 함께 보낸다", async () => {
  mockPost.mockResolvedValue({});
  await logoutRequest("rtk-1", "ExpoPushToken[a]");
  expect(mockPost).toHaveBeenCalledWith("/auth/logout", {
    refreshToken: "rtk-1",
    pushToken: "ExpoPushToken[a]",
  });
});

test("withdrawRequest 는 DELETE /auth/withdraw 에 refreshToken 을 보낸다", async () => {
  mockDelete.mockResolvedValue({});
  await withdrawRequest("rtk-2");
  expect(mockDelete).toHaveBeenCalledWith("/auth/withdraw", {
    data: { refreshToken: "rtk-2" },
  });
});
