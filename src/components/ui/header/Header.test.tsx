import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { Header } from "./Header";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderWithSafeArea = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);

describe("Header", () => {
  test("left·title·right 슬롯을 렌더한다", async () => {
    await renderWithSafeArea(
      <Header
        left={<Text>왼쪽</Text>}
        title="제목"
        right={<Text>오른쪽</Text>}
      />,
    );
    expect(screen.getByText("왼쪽")).toBeOnTheScreen();
    expect(screen.getByText("제목")).toBeOnTheScreen();
    expect(screen.getByText("오른쪽")).toBeOnTheScreen();
  });

  test("슬롯 없이도 정상 렌더된다", async () => {
    const { toJSON } = await renderWithSafeArea(<Header />);
    expect(toJSON()).toBeTruthy();
  });
});
