import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { Text } from "react-native";

import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { BottomSheet } from "./BottomSheet";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe("BottomSheet", () => {
  test("children 을 렌더한다", async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={jest.fn()}>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    expect(screen.getByText("내용")).toBeOnTheScreen();
  });

  test("시트가 닫히면 onClose 를 호출한다", async () => {
    const onClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={onClose}>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    fireEvent.press(screen.getByLabelText("sheet-dismiss"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("기본값(close)에선 백드롭 탭으로 닫힌다", async () => {
    const onClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={onClose}>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    fireEvent.press(screen.getByLabelText("sheet-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('backdropPressBehavior="none" 이면 백드롭 탭에도 닫히지 않는다', async () => {
    const onClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={onClose} backdropPressBehavior="none">
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    fireEvent.press(screen.getByLabelText("sheet-backdrop"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("isLocked 이면 pan-down 닫힘이 비활성화된다", async () => {
    const onClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={onClose} isLocked>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    const user = userEvent.setup();
    await user.press(screen.getByLabelText("sheet-dismiss"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
