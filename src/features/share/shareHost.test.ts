jest.mock("expo-share-extension", () => ({
  close: jest.fn(),
  openHostApp: jest.fn(),
}));
const mockContentReady = jest.fn();
let mockNativeModule: { contentReady?: () => void } | null = {
  contentReady: mockContentReady,
};
jest.mock("expo", () => ({
  requireOptionalNativeModule: () => mockNativeModule,
}));
const mockGetPendingRefresh = jest.fn<Promise<void> | null, []>();
jest.mock("@shared/api", () => ({
  getPendingRefresh: () => mockGetPendingRefresh(),
}));

import * as ShareExtension from "expo-share-extension";

import { close, notifyContentReady, openHostApp } from "./shareHost";

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

// 전체화면 프레젠테이션에서 네이티브가 JS 대신 깔아 둔 로딩 dim 은 시트가 백드롭을 그린 뒤 걷힌다.
test("콘텐츠 준비 알림은 네이티브 모듈에 전달한다", () => {
  notifyContentReady();
  expect(mockContentReady).toHaveBeenCalledTimes(1);
});

// 패치 전 빌드(함수 없음)나 모듈이 없는 환경에서도 시트는 떠야 한다.
test("네이티브에 콘텐츠 준비 함수가 없어도 실패하지 않는다", () => {
  mockNativeModule = null;
  expect(() => notifyContentReady()).not.toThrow();
  mockNativeModule = {};
  expect(() => notifyContentReady()).not.toThrow();
  mockNativeModule = { contentReady: mockContentReady };
});
