const mockStore = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));
jest.mock("@shared/entities/auth/auth.queries", () => ({
  logoutRequest: jest.fn().mockResolvedValue(undefined),
}));

import { ApiError, NetworkError } from "@shared/api/errors";
import { logoutRequest } from "@shared/entities/auth/auth.queries";

import { flushPendingLogout, sendLogout } from "./pendingLogout";

const request = { refreshToken: "rtk-1", pushToken: "ExpoPushToken[a]" };
const apiError = (status: number) =>
  new ApiError({ status, data: {} } as ConstructorParameters<
    typeof ApiError
  >[0]);

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation();
});

test("이 기기의 푸시 토큰과 함께 로그아웃을 보내고 기록을 남기지 않는다", async () => {
  await sendLogout(request);

  expect(logoutRequest).toHaveBeenCalledWith("rtk-1", "ExpoPushToken[a]");
  await flushPendingLogout();
  expect(logoutRequest).toHaveBeenCalledTimes(1);
});

// 서버 문서 #158: 기록한 뒤 보내고, 실패하면 다음 실행 때 같은 값으로 다시 보낸다.
test("네트워크 실패는 기록해 두었다가 다음에 같은 값으로 다시 보낸다", async () => {
  jest.mocked(logoutRequest).mockRejectedValueOnce(new NetworkError("offline"));
  await sendLogout(request);

  await flushPendingLogout();

  expect(logoutRequest).toHaveBeenCalledTimes(2);
  expect(logoutRequest).toHaveBeenLastCalledWith("rtk-1", "ExpoPushToken[a]");
  await flushPendingLogout();
  expect(logoutRequest).toHaveBeenCalledTimes(2);
});

test("서버 오류(5xx)도 다시 보낸다", async () => {
  jest.mocked(logoutRequest).mockRejectedValueOnce(apiError(500));
  await sendLogout(request);

  await flushPendingLogout();

  expect(logoutRequest).toHaveBeenCalledTimes(2);
});

test("다시 보내도 소용없는 요청 오류(4xx)는 기록을 버린다", async () => {
  jest.mocked(logoutRequest).mockRejectedValueOnce(apiError(401));
  await sendLogout(request);

  await flushPendingLogout();

  expect(logoutRequest).toHaveBeenCalledTimes(1);
});

test("앞서 실패한 로그아웃이 남아 있어도 덮어쓰지 않고 둘 다 보낸다", async () => {
  jest
    .mocked(logoutRequest)
    .mockRejectedValueOnce(new NetworkError("offline"))
    .mockRejectedValueOnce(new NetworkError("offline"))
    .mockRejectedValueOnce(new NetworkError("offline"));
  await sendLogout(request);
  await sendLogout({ refreshToken: "rtk-2", pushToken: null });

  await flushPendingLogout();

  expect(jest.mocked(logoutRequest).mock.calls.slice(-2)).toEqual(
    expect.arrayContaining([
      ["rtk-1", "ExpoPushToken[a]"],
      ["rtk-2", undefined],
    ]),
  );
});

test("동시에 불러도 같은 기록을 한 번만 보낸다", async () => {
  jest.mocked(logoutRequest).mockRejectedValueOnce(new NetworkError("offline"));
  await sendLogout(request);

  await Promise.all([flushPendingLogout(), flushPendingLogout()]);

  expect(logoutRequest).toHaveBeenCalledTimes(2);
});

function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

test("남은 기록을 보내는 중에 새로 로그아웃해도 이번에 함께 보낸다", async () => {
  jest.mocked(logoutRequest).mockRejectedValueOnce(new NetworkError("offline"));
  await sendLogout(request);
  const pendingFirst = deferred();
  jest.mocked(logoutRequest).mockReturnValueOnce(pendingFirst.promise);

  const flushing = flushPendingLogout();
  const sending = sendLogout({ refreshToken: "rtk-2", pushToken: null });
  pendingFirst.resolve();
  await Promise.all([flushing, sending]);

  expect(logoutRequest).toHaveBeenCalledWith("rtk-2", undefined);
});

test("로그아웃은 이번 요청만 기다리고, 남은 기록은 뒤에서 보낸다", async () => {
  jest.mocked(logoutRequest).mockRejectedValueOnce(new NetworkError("offline"));
  await sendLogout(request);
  const pendingFirst = deferred();
  jest
    .mocked(logoutRequest)
    .mockImplementation((refreshToken) =>
      refreshToken === "rtk-1" ? pendingFirst.promise : Promise.resolve(),
    );

  const result = await Promise.race([
    sendLogout({ refreshToken: "rtk-2", pushToken: null }).then(() => "done"),
    new Promise((resolve) => setTimeout(() => resolve("waiting"), 50)),
  ]);

  expect(result).toBe("done");
  pendingFirst.resolve();
  await flushPendingLogout();
  jest.mocked(logoutRequest).mockReset().mockResolvedValue(undefined);
});
