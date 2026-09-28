import { act, renderHook } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { useReduceMotion } from "./useReduceMotion";

const isReduceMotionEnabled = jest.mocked(
  AccessibilityInfo.isReduceMotionEnabled,
);
// 이벤트마다 시그니처가 다른 오버로드라 엄격한 목 타입으로는 핸들러를 꺼낼 수 없다 — 느슨한 목으로 받는다.
const addEventListener: jest.Mock = jest.mocked(
  AccessibilityInfo.addEventListener,
);

afterEach(() => {
  isReduceMotionEnabled.mockImplementation(() => Promise.resolve(false));
});

// 설정을 읽기 전에 애니메이션을 시작하면 동작 줄이기 사용자에게도 한 번은 움직인다 — 모름을 구분한다.
test("설정을 읽기 전에는 모름(null)이다", async () => {
  isReduceMotionEnabled.mockReturnValue(new Promise(() => {}));
  const { result } = await renderHook(() => useReduceMotion());
  expect(result.current).toBeNull();
});

// 모름으로 남으면 설정을 기다리는 애니메이션이 영영 시작되지 않는다.
test("설정을 한동안 읽지 못하면 꺼진 것으로 본다", async () => {
  jest.useFakeTimers();
  try {
    isReduceMotionEnabled.mockReturnValue(new Promise(() => {}));
    const { result } = await renderHook(() => useReduceMotion());
    expect(result.current).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(false);
  } finally {
    jest.useRealTimers();
  }
});

test("설정을 읽지 못하면 꺼진 것으로 본다", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  isReduceMotionEnabled.mockRejectedValue(new Error("unavailable"));
  const { result } = await renderHook(() => useReduceMotion());
  expect(result.current).toBe(false);
  warn.mockRestore();
});

test("OS 의 동작 줄이기 설정을 돌려준다", async () => {
  isReduceMotionEnabled.mockResolvedValue(true);
  const { result } = await renderHook(() => useReduceMotion());
  expect(result.current).toBe(true);
});

test("설정이 바뀌면 따라 바뀐다", async () => {
  const { result } = await renderHook(() => useReduceMotion());
  expect(result.current).toBe(false);

  const [, onChange] = addEventListener.mock.calls
    .filter(([eventName]) => eventName === "reduceMotionChanged")
    .at(-1);
  await act(async () => {
    onChange(true);
  });
  expect(result.current).toBe(true);
});

test("언마운트하면 설정 구독을 해제한다", async () => {
  const remove = jest.fn();
  addEventListener.mockReturnValueOnce({ remove });
  const { unmount } = await renderHook(() => useReduceMotion());

  await unmount();
  expect(remove).toHaveBeenCalled();
});
