import { act, renderHook } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { useReduceMotion } from "./useReduceMotion";

const isReduceMotionEnabled =
  AccessibilityInfo.isReduceMotionEnabled as jest.Mock;
const addEventListener = AccessibilityInfo.addEventListener as jest.Mock;

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
