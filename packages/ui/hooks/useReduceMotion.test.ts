import { act, renderHook } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { useReduceMotion } from "./useReduceMotion";

const isReduceMotionEnabled =
  AccessibilityInfo.isReduceMotionEnabled as jest.Mock;
const addEventListener = AccessibilityInfo.addEventListener as jest.Mock;

afterEach(() => {
  isReduceMotionEnabled.mockImplementation(() => Promise.resolve(false));
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
