import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { BottomSheet } from "./BottomSheet";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderWithProviders = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);

describe("BottomSheet", () => {
  test("children 을 렌더한다", async () => {
    await renderWithProviders(
      <BottomSheet onClose={jest.fn()}>
        <Text>내용</Text>
      </BottomSheet>,
    );
    expect(screen.getByText("내용")).toBeOnTheScreen();
  });

  test("백드롭을 누르면 onClose 를 호출한다", async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <BottomSheet onClose={onClose}>
        <Text>내용</Text>
      </BottomSheet>,
    );
    fireEvent.press(screen.getByLabelText("닫기"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
