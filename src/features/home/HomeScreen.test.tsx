import { render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { HomeScreen } from "./HomeScreen";
import { HOME_FOLDER_SECTIONS } from "./mocks";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <HomeScreen />
    </SafeAreaProvider>,
  );

describe("HomeScreen", () => {
  test("최근 저장 섹션과 폴더 그룹 타이틀을 보여준다", async () => {
    await renderScreen();

    expect(screen.getByText("최근 저장")).toBeOnTheScreen();
    expect(screen.getByText("마지막으로 저장한 폴더 순")).toBeOnTheScreen();
  });

  test("mock 폴더들을 섹션으로 렌더한다", async () => {
    await renderScreen();

    for (const { folder } of HOME_FOLDER_SECTIONS) {
      expect(screen.getByText(folder.folderName)).toBeOnTheScreen();
    }
  });
});
