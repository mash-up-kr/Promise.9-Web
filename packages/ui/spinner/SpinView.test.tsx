import { act, render } from "@testing-library/react-native";
import { NativeModules } from "react-native";

import { SpinView } from "./SpinView";

const { NativeAnimatedModule } = NativeModules;

// jest 의 NativeAnimatedModule 목은 넘겨받은 네이티브 애니메이션을 16ms 뒤에 끝낸다 —
// 무엇을 네이티브로 넘겼는지로 루프를 확인한다.
beforeEach(() => {
  jest.useFakeTimers();
  NativeAnimatedModule.startAnimatingNode.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

test("회전을 네이티브가 무한 반복하는 애니메이션 하나로 시작한다", async () => {
  await render(<SpinView />);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  const { calls } = NativeAnimatedModule.startAnimatingNode.mock;
  expect(calls).toHaveLength(1);
  expect(calls[0][2]).toEqual(expect.objectContaining({ iterations: -1 }));
});
