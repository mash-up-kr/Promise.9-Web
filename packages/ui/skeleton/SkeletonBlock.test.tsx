import { act, render } from "@testing-library/react-native";
import { AccessibilityInfo, NativeModules } from "react-native";

import { SkeletonBlock } from "./SkeletonBlock";

const { NativeAnimatedModule } = NativeModules;
const isReduceMotionEnabled =
  AccessibilityInfo.isReduceMotionEnabled as jest.Mock;

// jest 의 NativeAnimatedModule 목은 넘겨받은 네이티브 애니메이션을 16ms 뒤에 끝낸다 —
// 무엇을 네이티브로 넘겼는지로 루프를 확인한다.
beforeEach(() => {
  jest.useFakeTimers();
  NativeAnimatedModule.startAnimatingNode.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
  isReduceMotionEnabled.mockImplementation(() => Promise.resolve(false));
});

// 한 주기마다 JS 가 애니메이션을 다시 걸면(sequence 루프) 매초 브리지를 탄다 — 네이티브가 스스로 반복해야 한다.
test("펄스를 네이티브가 무한 반복하는 애니메이션 하나로 시작한다", async () => {
  await render(<SkeletonBlock />);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  const { calls } = NativeAnimatedModule.startAnimatingNode.mock;
  expect(calls).toHaveLength(1);
  expect(calls[0][2]).toEqual(expect.objectContaining({ iterations: -1 }));
});

// 설정을 읽기 전에 돌리기 시작하면 동작 줄이기 사용자에게도 잠깐 펄스가 보인다.
test("동작 줄이기가 켜져 있으면 펄스를 시작하지 않는다", async () => {
  isReduceMotionEnabled.mockResolvedValue(true);
  await render(<SkeletonBlock />);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(NativeAnimatedModule.startAnimatingNode).not.toHaveBeenCalled();
});
