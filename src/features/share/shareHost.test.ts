jest.mock("expo-share-extension", () => ({
  close: jest.fn(),
  openHostApp: jest.fn(),
}));
const mockGetPendingRefresh = jest.fn<Promise<void> | null, []>();
jest.mock("@shared/api", () => ({
  getPendingRefresh: () => mockGetPendingRefresh(),
}));

import * as ShareExtension from "expo-share-extension";

import { close, openHostApp } from "./shareHost";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockGetPendingRefresh.mockReturnValue(null);
});

afterEach(() => {
  jest.useRealTimers();
});

// iOS 는 앱을 연 뒤 네이티브가 곧 프로세스를 끝낸다 — 재발급 도중에 끊기면 회전된 리프레시 토큰을 잃는다.
test("본 앱 열기는 진행 중인 토큰 재발급이 끝난 뒤에 한다", async () => {
  const refresh = deferred();
  mockGetPendingRefresh.mockReturnValue(refresh.promise);

  openHostApp("link/1");
  await jest.advanceTimersByTimeAsync(0);
  expect(ShareExtension.openHostApp).not.toHaveBeenCalled();

  refresh.resolve();
  await jest.advanceTimersByTimeAsync(0);
  expect(ShareExtension.openHostApp).toHaveBeenCalledWith("link/1");
});

test("닫기는 기다리지 않고 바로 닫는다", () => {
  mockGetPendingRefresh.mockReturnValue(deferred().promise);
  close();
  expect(ShareExtension.close).toHaveBeenCalledTimes(1);
});
