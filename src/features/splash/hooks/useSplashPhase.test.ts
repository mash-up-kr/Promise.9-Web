import { act, renderHook } from "@testing-library/react-native";

import { useSplashPhase } from "./useSplashPhase";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test("마운트 직후에는 shown 이다", async () => {
  const { result } = await renderHook(() => useSplashPhase(false));
  expect(result.current).toBe("shown");
});

test("초기화가 끝나도 최소 노출 1초 전에는 shown 을 유지한다", async () => {
  const { result, rerender } = await renderHook(
    ({ isReady }: { isReady: boolean }) => useSplashPhase(isReady),
    { initialProps: { isReady: false } },
  );

  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  await rerender({ isReady: true });

  await act(async () => {
    jest.advanceTimersByTime(599);
  });
  expect(result.current).toBe("shown");

  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(result.current).toBe("fading");
});

test("1초가 지난 뒤 초기화가 끝나면 곧바로 fading 으로 전환한다", async () => {
  const { result, rerender } = await renderHook(
    ({ isReady }: { isReady: boolean }) => useSplashPhase(isReady),
    { initialProps: { isReady: false } },
  );

  await act(async () => {
    jest.advanceTimersByTime(1500);
  });
  expect(result.current).toBe("shown");

  await rerender({ isReady: true });
  await act(async () => {
    jest.advanceTimersByTime(0);
  });
  expect(result.current).toBe("fading");
});

test("fading 은 0.3초 뒤 hidden 이 된다", async () => {
  const { result } = await renderHook(() => useSplashPhase(true));

  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(result.current).toBe("fading");

  await act(async () => {
    jest.advanceTimersByTime(299);
  });
  expect(result.current).toBe("fading");

  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(result.current).toBe("hidden");
});
