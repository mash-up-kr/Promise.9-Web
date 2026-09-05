// axios.create 로 만든 인스턴스의 post 를 제어한다.
const mockPost = jest.fn();
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: () => ({ post: mockPost }),
    isAxiosError: (error: unknown) =>
      typeof error === "object" && error !== null && "isAxiosError" in error,
  },
}));

function axiosStatusError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status },
  });
}

jest.mock("./token", () => ({
  getRefreshToken: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

import { refreshAccessToken } from "./refresh";
import { clearTokens, getRefreshToken, setTokens } from "./token";

const okResponse = {
  data: { data: { accessToken: "atk-new", refreshToken: "rtk-new" } },
};

beforeEach(() => {
  jest.clearAllMocks();
  (getRefreshToken as jest.Mock).mockResolvedValue("rtk-old");
});

test("refreshToken 으로 재발급하고 새 토큰을 저장한 뒤 accessToken 을 반환한다", async () => {
  mockPost.mockResolvedValue(okResponse);
  const token = await refreshAccessToken();
  expect(mockPost).toHaveBeenCalledWith("/auth/refresh", {
    refreshToken: "rtk-old",
  });
  expect(setTokens).toHaveBeenCalledWith("atk-new", "rtk-new");
  expect(token).toBe("atk-new");
});

test("동시 호출은 재발급을 한 번만 수행한다 (single-flight)", async () => {
  let resolve!: (v: unknown) => void;
  mockPost.mockReturnValue(new Promise((r) => (resolve = r)));
  const p1 = refreshAccessToken();
  const p2 = refreshAccessToken();
  resolve(okResponse);
  await Promise.all([p1, p2]);
  expect(mockPost).toHaveBeenCalledTimes(1);
});

test("refreshToken 이 없으면 clearTokens 후 throw 한다", async () => {
  (getRefreshToken as jest.Mock).mockResolvedValue(null);
  await expect(refreshAccessToken()).rejects.toThrow();
  expect(clearTokens).toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
});

test("서버가 토큰을 거절(401)하면 clearTokens 후 throw 한다", async () => {
  mockPost.mockRejectedValue(axiosStatusError(401));
  await expect(refreshAccessToken()).rejects.toThrow();
  expect(clearTokens).toHaveBeenCalled();
});

test("네트워크 오류·타임아웃처럼 일시 장애면 토큰을 지우지 않고 throw 한다", async () => {
  mockPost.mockRejectedValue(
    Object.assign(new Error("timeout"), {
      isAxiosError: true,
      code: "ECONNABORTED",
    }),
  );
  await expect(refreshAccessToken()).rejects.toThrow();
  expect(clearTokens).not.toHaveBeenCalled();
});

test("서버 오류(5xx)면 토큰을 지우지 않고 throw 한다", async () => {
  mockPost.mockRejectedValue(axiosStatusError(503));
  await expect(refreshAccessToken()).rejects.toThrow();
  expect(clearTokens).not.toHaveBeenCalled();
});
