import { render, screen, userEvent } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import {
  ShareSheet,
  ShareSheetScrollView,
  useShareSheetDismiss,
} from "./ShareSheet.android";

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
        <CancelButton />
      </ShareSheet>
    </SafeAreaProvider>,
  );
  return { onClose };
}

test("백드롭을 탭하면 onClose 를 부른다", async () => {
  const { onClose } = await renderSheet();
  await userEvent.setup().press(screen.getByLabelText("sheet-backdrop"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("시트를 끌어 내리면 onClose 를 부른다", async () => {
  const { onClose } = await renderSheet();
  await userEvent.setup().press(screen.getByLabelText("sheet-dismiss"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("잠금 중에는 백드롭 탭·끌어 내리기로 닫히지 않는다", async () => {
  const { onClose } = await renderSheet({ isLocked: true });
  const user = userEvent.setup();
  await user.press(screen.getByLabelText("sheet-backdrop"));
  await user.press(screen.getByLabelText("sheet-dismiss"));
  expect(onClose).not.toHaveBeenCalled();
});

test("시트 안에서 useShareSheetDismiss 로 닫을 수 있다", async () => {
  const { onClose } = await renderSheet();
  await userEvent.setup().press(screen.getByText("취소"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("닫기 전에 기다릴 일이 있으면 끝난 뒤에 onClose 를 부른다", async () => {
  const onClose = jest.fn();
  let proceed!: () => void;
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ShareSheet
        onClose={onClose}
        isLocked={false}
        waitBeforeClose={(next) => {
          proceed = next;
        }}
      >
        <CancelButton />
      </ShareSheet>
    </SafeAreaProvider>,
  );
  await userEvent.setup().press(screen.getByLabelText("sheet-backdrop"));
  expect(onClose).not.toHaveBeenCalled();

  proceed();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("스크롤 시트의 헤더는 스크롤의 sticky 첫 요소로 둔다", async () => {
  await render(
    <ShareSheetScrollView testID="scroll" header={<Text>헤더</Text>}>
      <Text>본문</Text>
    </ShareSheetScrollView>,
  );
  expect(screen.getByTestId("scroll").props.stickyHeaderIndices).toEqual([0]);
  expect(screen.getByText("헤더")).toBeOnTheScreen();
});
