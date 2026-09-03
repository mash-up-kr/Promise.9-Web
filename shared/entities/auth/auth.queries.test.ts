jest.mock("@shared/api", () => ({
  apiClient: { post: jest.fn(), delete: jest.fn() },
}));

import { apiClient } from "@shared/api";

import { logoutRequest, withdrawRequest } from "./auth-actions.queries";

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

test("withdrawRequest 는 DELETE /auth/withdraw 에 refreshToken 을 보낸다", async () => {
  mockDelete.mockResolvedValue({});
  await withdrawRequest("rtk-2");
  expect(mockDelete).toHaveBeenCalledWith("/auth/withdraw", {
    data: { refreshToken: "rtk-2" },
  });
});
