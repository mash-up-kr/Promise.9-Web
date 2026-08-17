jest.mock("@shared/api", () => ({ setAccessToken: jest.fn() }));

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { setAccessToken } from "@shared/api";
import { renderHook } from "@testing-library/react-native";

import { useWithdraw } from "./useWithdraw";

describe("useWithdraw", () => {
  beforeEach(() => {
    (setAccessToken as jest.Mock).mockClear();
    mockReplace.mockClear();
  });

  test("accessToken 을 지우고 로그인 화면으로 이동한다", async () => {
    const { result } = await renderHook(() => useWithdraw());
    await result.current();
    expect(setAccessToken).toHaveBeenCalledWith(null);
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });
});
