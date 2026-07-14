import { render, screen } from "@testing-library/react-native";

import { HomeScreen } from "./HomeScreen";
import { HOME_FOLDER_SECTIONS } from "./mocks";

describe("HomeScreen", () => {
  test("최근 저장 섹션과 폴더 그룹 타이틀을 보여준다", async () => {
    await render(<HomeScreen />);

    expect(screen.getByText("최근 저장")).toBeOnTheScreen();
    expect(screen.getByText("마지막으로 저장한 폴더 순")).toBeOnTheScreen();
  });

  test("mock 폴더들을 섹션으로 렌더한다", async () => {
    await render(<HomeScreen />);

    for (const { folder } of HOME_FOLDER_SECTIONS) {
      expect(screen.getByText(folder.name)).toBeOnTheScreen();
    }
  });
});
