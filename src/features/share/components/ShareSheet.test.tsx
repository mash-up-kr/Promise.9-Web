import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
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

test("children 을 렌더한다", async () => {
  await renderSheet();
  expect(screen.getByText("내용")).toBeOnTheScreen();
});

test("백드롭을 탭하면 퇴장 애니메이션 후 onClose 를 부른다", async () => {
  const { onClose } = await renderSheet();
  await userEvent.setup().press(screen.getByLabelText("시트 닫기"));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

test("잠금 중에는 백드롭을 탭해도 닫히지 않는다", async () => {
  const { onClose } = await renderSheet({ isLocked: true });
  await userEvent.setup().press(screen.getByLabelText("시트 닫기"));
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(onClose).not.toHaveBeenCalled();
});

test("시트 안에서 useShareSheetDismiss 로 닫을 수 있다", async () => {
  const { onClose } = await renderSheet();
  await userEvent.setup().press(screen.getByText("취소"));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

test("여러 번 닫기를 요청해도 onClose 는 한 번만 부른다", async () => {
  const { onClose } = await renderSheet();
  const user = userEvent.setup();
  await user.press(screen.getByText("취소"));
  await user.press(screen.getByLabelText("시트 닫기"));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(onClose).toHaveBeenCalledTimes(1);
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
