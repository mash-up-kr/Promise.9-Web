import { fireEvent, render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { ArchiveScreen } from "./ArchiveScreen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ArchiveScreen />
    </SafeAreaProvider>,
  );

describe("ArchiveScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test("기본 폴더/내 폴더 섹션 타이틀을 렌더한다", async () => {
    await renderScreen();
    expect(screen.getByText("기본 폴더")).toBeOnTheScreen();
    expect(screen.getByText("내 폴더")).toBeOnTheScreen();
  });

  test("기본 폴더와 사용자 폴더 항목을 렌더한다", async () => {
    await renderScreen();
    expect(screen.getByText("전체")).toBeOnTheScreen();
    expect(screen.getByText("즐겨찾기")).toBeOnTheScreen();
    expect(screen.getByText("디자인")).toBeOnTheScreen();
    expect(screen.getByText("최근 삭제된 링크")).toBeOnTheScreen();
  });

  test("폴더를 누르면 해당 폴더 상세로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByText("전체"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/archive/[id]",
      params: { id: "all" },
    });
  });
});
