import { act, renderHook } from "@testing-library/react-native";

import { useDelayedLoading } from "./useDelayedLoading";

describe("useDelayedLoading", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("200ms 미만에 끝나면 한 번도 true 가 되지 않는다(스피너 생략)", async () => {
    const { result, rerender } = await renderHook(
      ({ isLoading }: { isLoading: boolean }) => useDelayedLoading(isLoading),
      { initialProps: { isLoading: true } },
    );
    expect(result.current).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    await rerender({ isLoading: false });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(false);
  });

  test("200ms 이상 걸리면 true 로 전환된다", async () => {
    const { result } = await renderHook(() => useDelayedLoading(true));

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });

  test("표시되자마자 끝나도 최소 300ms 는 유지된다", async () => {
    const { result, rerender } = await renderHook(
      ({ isLoading }: { isLoading: boolean }) => useDelayedLoading(isLoading),
      { initialProps: { isLoading: true } },
    );

    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe(true);

    await rerender({ isLoading: false });
    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  test("최소 유지시간이 이미 지났으면 종료 즉시 사라진다", async () => {
    const { result, rerender } = await renderHook(
      ({ isLoading }: { isLoading: boolean }) => useDelayedLoading(isLoading),
      { initialProps: { isLoading: true } },
    );

    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(true);

    await rerender({ isLoading: false });
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe(false);
  });

  test("delayMs·minDurationMs 옵션으로 정책을 조절할 수 있다", async () => {
    const { result, rerender } = await renderHook(
      ({ isLoading }: { isLoading: boolean }) =>
        useDelayedLoading(isLoading, { delayMs: 50, minDurationMs: 100 }),
      { initialProps: { isLoading: true } },
    );

    await act(async () => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe(true);

    await rerender({ isLoading: false });
    await act(async () => {
      jest.advanceTimersByTime(99);
    });
    expect(result.current).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });
});
