import { act, render, screen, userEvent } from "@testing-library/react-native";
import {
  AccessibilityInfo,
  NativeModules,
  Pressable,
  Text,
} from "react-native";
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
const isReduceMotionEnabled =
  AccessibilityInfo.isReduceMotionEnabled as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  isReduceMotionEnabled.mockImplementation(() => Promise.resolve(false));
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

interface RenderSheetOptions {
  isLocked?: boolean;
  waitBeforeClose?: (proceed: () => void) => void;
  /** 렌더 뒤 알려 줄 콘텐츠 높이 — null 이면 재지 않아 시트가 올라오지 않은 채로 둔다. */
  contentHeight?: number | null;
}

async function renderSheet({
  isLocked = false,
  waitBeforeClose,
  contentHeight = 300,
}: RenderSheetOptions = {}) {
  const onClose = jest.fn();
  const onOtherPress = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ShareSheet
        onClose={onClose}
        isLocked={isLocked}
        waitBeforeClose={waitBeforeClose}
      >
        <Text>내용</Text>
        <CancelButton />
        <Pressable accessibilityRole="button" onPress={onOtherPress}>
          <Text>다른 동작</Text>
        </Pressable>
      </ShareSheet>
    </SafeAreaProvider>,
  );
  if (contentHeight !== null) {
    await layoutContent(contentHeight);
  }
  return { onClose, onOtherPress };
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

// jest 에는 레이아웃 엔진이 없다 — 시트가 재는 콘텐츠(핸들 포함) 높이를 직접 알려준다.
async function layoutContent(height: number) {
  const content = screen.getByTestId("share-sheet-handle").parent;
  await act(async () => {
    content?.props.onLayout({
      nativeEvent: { layout: { x: 0, y: 0, width: 375, height } },
    });
  });
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

// 기다리는 동안 보이지 않는 전체 화면이 호스트를 막지 않도록, 시트를 띄워 둔 채 기다렸다가 내려간다.
test("닫기 전에 기다릴 일이 있으면 시트를 띄운 채 조작을 막고, 끝나면 내려간다", async () => {
  const { NativeAnimatedModule } = NativeModules;
  let proceed!: () => void;
  const { onClose, onOtherPress } = await renderSheet({
    waitBeforeClose: (next) => {
      proceed = next;
    },
  });
  NativeAnimatedModule.startAnimatingNode.mockClear();
  const user = setupUser();

  await user.press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(NativeAnimatedModule.startAnimatingNode).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  await user.press(screen.getByText("다른 동작"));
  expect(onOtherPress).not.toHaveBeenCalled();

  await act(async () => {
    proceed();
  });
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

// gorhom 처럼 손을 뗀 속도의 절반을 이어받는다(PanResponder 는 px/ms, 스프링은 px/s).
test.each([
  { name: "닫힐 때", dy: 150, durationMs: 300 },
  { name: "제자리로 돌아갈 때", dy: 60, durationMs: 200 },
])("$name 손을 뗀 속도를 이어받아 움직인다", async ({ dy, durationMs }) => {
  const { NativeAnimatedModule } = NativeModules;
  await renderSheet();
  NativeAnimatedModule.startAnimatingNode.mockClear();

  await dragHandle(dy, durationMs);

  const [, , config] =
    NativeAnimatedModule.startAnimatingNode.mock.calls.at(-1);
  expect(config.initialVelocity).toBeCloseTo(((dy / durationMs) * 1000) / 2);
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
  // 콘텐츠를 재면 등장 애니메이션이 시작된다 — 끝나기 전에 잡는다.
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

  const user = setupUser();
  await user.press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(onClose).not.toHaveBeenCalled();

  // 닫는 중 상태에 갇히지 않고 다시 닫을 수 있다.
  await user.press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

// 호스트 공유 시트 위로 뜨는 동안 들어온 탭이 보이지도 않는 시트를 닫지 않게 한다.
test("올라오기 시작하기 전에는 백드롭을 눌러도 닫히지 않는다", async () => {
  const { onClose } = await renderSheet({ contentHeight: null });
  await setupUser().press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(onClose).not.toHaveBeenCalled();

  await layoutContent(300);
  await setupUser().press(screen.getByLabelText("시트 닫기"));
  await finishAnimations();
  expect(onClose).toHaveBeenCalledTimes(1);
});

// 올라오기 전에 콘텐츠가 커지면(확인 → 저장 시트) 예전 높이만큼만 내려가 있어 윗부분이 비친다.
test("올라오기 전에 콘텐츠 높이가 바뀌면 시트를 새 높이만큼 내려 둔다", async () => {
  isReduceMotionEnabled.mockReturnValue(new Promise(() => {}));
  await renderSheet({ contentHeight: null });

  await layoutContent(300);
  await layoutContent(500);

  const sheet = screen.getByTestId("share-sheet");
  expect(sheet).toHaveStyle({ height: 500 });
  expect(sheet.parent).toHaveStyle({ transform: [{ translateY: 500 }] });
});

test("동작 줄이기 설정을 끝내 읽지 못해도 잠시 뒤 올라온다", async () => {
  const { NativeAnimatedModule } = NativeModules;
  isReduceMotionEnabled.mockReturnValue(new Promise(() => {}));
  NativeAnimatedModule.startAnimatingNode.mockClear();
  await renderSheet();
  expect(NativeAnimatedModule.startAnimatingNode).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    expect.objectContaining({ toValue: 0 }),
    expect.anything(),
  );

  // 설정을 기다리는 시한(0.5초)이 지나면 꺼진 것으로 보고 평소처럼 미끄러져 올라온다.
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  expect(NativeAnimatedModule.startAnimatingNode).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    expect.objectContaining({ toValue: 0 }),
    expect.anything(),
  );
});

test("등장 애니메이션이 끝났다는 신호가 없으면 잠시 뒤 제자리에 올려 둔다", async () => {
  const { NativeAnimatedModule } = NativeModules;
  NativeAnimatedModule.startAnimatingNode.mockImplementationOnce(() => {});
  await renderSheet();
  NativeAnimatedModule.setAnimatedNodeValue.mockClear();

  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  expect(NativeAnimatedModule.setAnimatedNodeValue).toHaveBeenCalledWith(
    expect.any(Number),
    0,
  );
});

test.each([
  {
    name: "닫기 전 기다림이 끝나지 않아도",
    waitBeforeClose: () => {},
    mockExit: () => {},
  },
  {
    name: "퇴장 애니메이션이 끝났다는 신호가 없어도",
    waitBeforeClose: undefined,
    mockExit: () =>
      NativeModules.NativeAnimatedModule.startAnimatingNode.mockImplementationOnce(
        () => {},
      ),
  },
])("$name 조작이 막힌 채 남지 않고 잠시 뒤 닫힌다", async ({
  waitBeforeClose,
  mockExit,
}) => {
  const { onClose } = await renderSheet({ waitBeforeClose });
  mockExit();

  await setupUser().press(screen.getByLabelText("시트 닫기"));
  await act(async () => {
    jest.advanceTimersByTime(10_000);
  });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("콘텐츠 높이를 재면 시트를 그 높이로 맞춘다", async () => {
  await renderSheet({ contentHeight: null });
  await layoutContent(300);
  expect(screen.getByTestId("share-sheet")).toHaveStyle({ height: 300 });
});

test("콘텐츠 높이가 바뀌면 시트 높이가 한 번에 튀지 않고 따라간다", async () => {
  await renderSheet({ contentHeight: null });
  await layoutContent(300);
  await layoutContent(500);
  expect(screen.getByTestId("share-sheet")).toHaveStyle({ height: 300 });

  await finishAnimations();
  expect(screen.getByTestId("share-sheet")).toHaveStyle({ height: 500 });
});

// 동작 줄이기 사용자에게 첫 등장부터 미끄러지지 않도록, 설정을 읽은 뒤에 올라온다.
test("동작 줄이기 설정을 읽기 전에는 콘텐츠를 재도 올라오지 않는다", async () => {
  const { NativeAnimatedModule } = NativeModules;
  let resolveSetting!: (isEnabled: boolean) => void;
  isReduceMotionEnabled.mockReturnValue(
    new Promise((resolve) => {
      resolveSetting = resolve;
    }),
  );
  await renderSheet({ contentHeight: null });
  NativeAnimatedModule.startAnimatingNode.mockClear();

  await layoutContent(300);
  expect(NativeAnimatedModule.startAnimatingNode).not.toHaveBeenCalled();

  await act(async () => {
    resolveSetting(false);
  });
  expect(NativeAnimatedModule.startAnimatingNode).toHaveBeenCalled();
});

describe("동작 줄이기가 켜져 있으면", () => {
  beforeEach(() => {
    isReduceMotionEnabled.mockResolvedValue(true);
  });

  test("미끄러지는 애니메이션 없이 바로 닫는다", async () => {
    const { NativeAnimatedModule } = NativeModules;
    const { onClose } = await renderSheet();
    NativeAnimatedModule.startAnimatingNode.mockClear();

    await setupUser().press(screen.getByLabelText("시트 닫기"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(NativeAnimatedModule.startAnimatingNode).not.toHaveBeenCalled();
  });

  test("콘텐츠 높이가 바뀌면 곧바로 맞춘다", async () => {
    await renderSheet({ contentHeight: null });
    await layoutContent(300);
    await layoutContent(500);
    expect(screen.getByTestId("share-sheet")).toHaveStyle({ height: 500 });
  });
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
