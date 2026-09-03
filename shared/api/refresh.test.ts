// axios.create 로 만든 인스턴스의 post 를 제어한다.
const mockPost = jest.fn();
jest.mock("axios", () => ({
  __esModule: true,
  default: { create: () => ({ post: mockPost }) },
}));

jest.mock("./token", () => ({
  getRefreshToken: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
  runExclusive: jest.fn((run: () => Promise<unknown>) => run()),
}));

import { refreshAccessToken } from "./refresh";
import { clearTokens, getRefreshToken, runExclusive, setTokens } from "./token";

const okResponse = {
  data: { data: { accessToken: "atk-new", refreshToken: "rtk-new" } },
};

beforeEach(() => {
  jest.clearAllMocks();
  (getRefreshToken as jest.Mock).mockResolvedValue("rtk-old");
  (runExclusive as jest.Mock).mockImplementation(
    (run: () => Promise<unknown>) => run(),
  );
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

test("재발급 요청이 실패하면 clearTokens 후 throw 한다", async () => {
  mockPost.mockRejectedValue(new Error("401"));
  await expect(refreshAccessToken()).rejects.toThrow();
  expect(clearTokens).toHaveBeenCalled();
});

// 익스텐션은 패널과 service worker 가 한 저장소를 공유한다 — 모듈 변수 하나로는 두 문서를
// 가로질러 막을 수 없어, 저장소 구현이 주입한 배타 실행에 재발급 전체를 맡긴다.
test("재발급은 주입된 배타 실행 안에서 돈다", async () => {
  mockPost.mockResolvedValue(okResponse);

  await refreshAccessToken();

  expect(runExclusive).toHaveBeenCalledTimes(1);
});

// 순서가 핵심이다 — 기다리는 쪽이 배타 구간에 들어가기 전에 토큰을 읽어두면, 앞선 쪽이
// 회전시켜 이미 폐기된 토큰으로 재발급을 시도하게 된다(RTR 거부 → 양쪽 로그아웃).
test("리프레시 토큰은 배타 구간에 들어간 뒤에 읽는다", async () => {
  let enter!: () => void;
  (runExclusive as jest.Mock).mockImplementation(
    async (run: () => Promise<unknown>) => {
      await new Promise<void>((resolve) => {
        enter = resolve;
      });
      return run();
    },
  );
  mockPost.mockResolvedValue(okResponse);

  const pending = refreshAccessToken();
  expect(getRefreshToken).not.toHaveBeenCalled();

  enter();
  await pending;

  expect(getRefreshToken).toHaveBeenCalled();
});
