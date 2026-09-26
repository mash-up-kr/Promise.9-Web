const mockGetPendingRefresh = jest.fn<Promise<void> | null, []>();
jest.mock("@shared/api", () => ({
  getPendingRefresh: () => mockGetPendingRefresh(),
}));

import { QueryClient } from "@tanstack/react-query";

import {
  PENDING_WORK_TIMEOUT_MS,
  runAfterPendingWork,
} from "./runAfterPendingWork";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

// 대기 중인 Promise·타이머를 흘려보낸다(실제 시간은 기다리지 않는다).
async function flush(ms = 0) {
  await jest.advanceTimersByTimeAsync(ms);
}

beforeEach(() => {
  jest.useFakeTimers();
  mockGetPendingRefresh.mockReturnValue(null);
});

afterEach(() => {
  jest.useRealTimers();
});

test("기다릴 작업이 없으면 바로 부른다", () => {
  const run = jest.fn();
  runAfterPendingWork(run, new QueryClient());
  expect(run).toHaveBeenCalledTimes(1);
});

test("진행 중인 토큰 재발급이 끝난 뒤에 부른다", async () => {
  const refresh = deferred();
  mockGetPendingRefresh.mockReturnValue(refresh.promise);
  const run = jest.fn();

  runAfterPendingWork(run);
  await flush();
  expect(run).not.toHaveBeenCalled();

  refresh.resolve();
  await flush();
  expect(run).toHaveBeenCalledTimes(1);
});

test("진행 중인 요청(mutation)이 끝난 뒤에 부른다", async () => {
  const queryClient = new QueryClient();
  const request = deferred();
  const mutation = queryClient
    .getMutationCache()
    .build(queryClient, { mutationFn: () => request.promise });
  const execution = mutation.execute(undefined);
  const run = jest.fn();

  runAfterPendingWork(run, queryClient);
  await flush();
  expect(run).not.toHaveBeenCalled();

  request.resolve();
  await execution;
  await flush();
  expect(run).toHaveBeenCalledTimes(1);
});

// 기다리던 작업이 실패해도 닫기가 멈춰 있으면 안 된다.
test("기다리던 작업이 실패해도 부른다", async () => {
  mockGetPendingRefresh.mockReturnValue(Promise.reject(new Error("refresh")));
  const run = jest.fn();

  runAfterPendingWork(run);
  await flush();
  expect(run).toHaveBeenCalledTimes(1);
});

test("끝나지 않는 작업은 제한 시간까지만 기다린다", async () => {
  mockGetPendingRefresh.mockReturnValue(new Promise(() => {}));
  const run = jest.fn();

  runAfterPendingWork(run);
  await flush(PENDING_WORK_TIMEOUT_MS - 1);
  expect(run).not.toHaveBeenCalled();

  await flush(1);
  expect(run).toHaveBeenCalledTimes(1);
});
