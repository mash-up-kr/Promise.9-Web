import { act, render, screen, userEvent } from "@testing-library/react-native";
import { NativeModules, Pressable, Text } from "react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import {
  ShareSheet,
  ShareSheetScrollView,
  shouldDismissByDrag,
  useShareSheetDismiss,
} from "./ShareSheet";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// 시트 애니메이션은 네이티브 드라이버라 jest 의 NativeAnimatedModule 목이 16ms 뒤에 끝낸다 —
// 실제로 기다리지 않고 가짜 타이머로 흘려보낸다.
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function setupUser() {
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
}

async function finishAnimations() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

function CancelButton() {
  const dismiss = useShareSheetDismiss();
  return (
    <Pressable accessibilityRole="button" onPress={dismiss}>
      <Text>취소</Text>
    </Pressable>
  );
}

async function renderSheet({ isLocked = false } = {}) {
  const onClose = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ShareSheet onClose={onClose} isLocked={isLocked}>
        <Text>내용</Text>
        <CancelButton />
      </ShareSheet>
    </SafeAreaProvider>,
  );
  return { onClose };
}

interface TouchPoint {
  y: number;
  timestamp: number;
}

// PanResponder 는 이벤트의 touchHistory 로 이동 거리·속도를 계산한다 — 손가락 하나의 기록을 흉내 낸다.
function touchEvent(current: TouchPoint, previous: TouchPoint) {
  return {
    nativeEvent: { touches: [{}], changedTouches: [{}] },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: current.timestamp,
      touchBank: [
        {
          touchActive: true,
          startPageX: 0,
          startPageY: 0,
          startTimeStamp: 0,
          currentPageX: 0,
          currentPageY: current.y,
          currentTimeStamp: current.timestamp,
          previousPageX: 0,
          previousPageY: previous.y,
          previousTimeStamp: previous.timestamp,
        },
      ],
    },
  };
}

/**
 * 핸들을 dy 만큼 durationMs 동안 끌어 내렸다 놓는다 — 응답자 시스템이 핸들에 보내는 순서대로
 * 부른다. 핸들이 제스처를 가져가지 않으면(false) 거기서 멈춘다.
 */
async function dragHandle(dy: number, durationMs: number) {
  const handle = screen.getByTestId("share-sheet-handle");
  const down = { y: 100, timestamp: 1000 };
  // 이동 임계(4px)를 넘겨 응답자를 요청하는 첫 이동.
  const start = { y: 110, timestamp: 1016 };
  const end = { y: 110 + dy, timestamp: 1016 + durationMs };
  let isGranted = false;
  await act(async () => {
    handle.props.onStartShouldSetResponderCapture(touchEvent(down, down));
    handle.props.onMoveShouldSetResponderCapture(touchEvent(start, down));
    isGranted = handle.props.onMoveShouldSetResponder(touchEvent(start, down));
    if (!isGranted) return;
    handle.props.onResponderGrant(touchEvent(start, down));
    handle.props.onResponderMove(touchEvent(end, start));
    handle.props.onResponderRelease(touchEvent(end, start));
  });
  return isGranted;
}

test("children 을 렌더한다", async () => {
  await renderSheet();
  expect(screen.getByText("내용")).toBeOnTheScreen();
});

test("백드롭을 탭하면 퇴장 애니메이션 후 onClose 를 부른다", async () => {
  const { onClose } = await renderSheet();
  await setupUser().press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("잠금 중에는 백드롭을 탭해도 닫히지 않는다", async () => {
  const { onClose } = await renderSheet({ isLocked: true });
  await setupUser().press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(onClose).not.toHaveBeenCalled();
});

test("시트 안에서 useShareSheetDismiss 로 닫을 수 있다", async () => {
  const { onClose } = await renderSheet();
  await setupUser().press(screen.getByText("취소"));
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("여러 번 닫기를 요청해도 onClose 는 한 번만 부른다", async () => {
  const { onClose } = await renderSheet();
  const user = setupUser();
  await user.press(screen.getByText("취소"));
  await user.press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("핸들을 충분히 끌어 내리면 닫는다", async () => {
  const { onClose } = await renderSheet();
  expect(await dragHandle(150, 300)).toBe(true);
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("핸들을 빠르게 튕기면 짧게 끌어도 닫는다", async () => {
  const { onClose } = await renderSheet();
  expect(await dragHandle(30, 16)).toBe(true);
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("핸들을 조금 끌었다 천천히 놓으면 닫히지 않는다", async () => {
  const { onClose } = await renderSheet();
  expect(await dragHandle(60, 200)).toBe(true);
  await finishAnimations();
  expect(onClose).not.toHaveBeenCalled();
});

test("잠금 중에는 핸들을 끌어도 제스처를 받지 않는다", async () => {
  const { onClose } = await renderSheet({ isLocked: true });
  expect(await dragHandle(150, 300)).toBe(false);
  await finishAnimations();
  expect(onClose).not.toHaveBeenCalled();
});

test("닫히는 중에는 핸들을 끌어도 제스처를 받지 않는다", async () => {
  const { onClose } = await renderSheet();
  await setupUser().press(screen.getByLabelText("시트 닫기"));
  expect(await dragHandle(60, 200)).toBe(false);
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

// 시트 위치는 네이티브 드라이버가 들고 있다 — 멈춘 자리를 오프셋으로 넘겨받아야 0 으로 튀지 않는다.
test("드래그를 잡으면 움직이던 시트를 그 자리에서 멈추고 이어서 끈다", async () => {
  const { NativeAnimatedModule } = NativeModules;
  await renderSheet();
  NativeAnimatedModule.stopAnimation.mockClear();
  NativeAnimatedModule.extractAnimatedNodeOffset.mockClear();

  await dragHandle(60, 200);

  expect(NativeAnimatedModule.stopAnimation).toHaveBeenCalled();
  expect(NativeAnimatedModule.extractAnimatedNodeOffset).toHaveBeenCalled();
});

test("퇴장 애니메이션이 끝까지 가지 못하면 onClose 를 부르지 않는다", async () => {
  const { NativeAnimatedModule } = NativeModules;
  const { onClose } = await renderSheet();
  NativeAnimatedModule.startAnimatingNode.mockImplementationOnce(
    (
      _id: number,
      _tag: number,
      _config: object,
      endCallback: (result: { finished: boolean }) => void,
    ) => endCallback({ finished: false }),
  );

  await setupUser().press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();

  expect(onClose).not.toHaveBeenCalled();
});

test.each([
  { dy: 130, vy: 0, expected: true },
  { dy: 30, vy: 1.2, expected: true },
  { dy: 60, vy: 0.3, expected: false },
  { dy: 10, vy: 2, expected: false },
])("끌어 내린 거리 $dy·속도 $vy → 닫힘 $expected", ({ dy, vy, expected }) => {
  expect(shouldDismissByDrag(dy, vy)).toBe(expected);
});

// gorhom 스크롤뷰(인앱·Android)의 기본값과 같다.
test("시트 스크롤을 끌어 내리면 키보드도 따라 내려간다", async () => {
  await render(<ShareSheetScrollView testID="scroll" />);
  expect(screen.getByTestId("scroll").props.keyboardDismissMode).toBe(
    "interactive",
  );
});
