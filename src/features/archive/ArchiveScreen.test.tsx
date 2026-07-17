import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ArchiveScreen } from "./ArchiveScreen";

const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));

const renderScreen = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ArchiveScreen />
    </SafeAreaProvider>,
  );

describe("ArchiveScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockNavigate.mockClear();
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

  test("더보기 → 폴더 정렬 편집 시 편집 모드로 전환한다", async () => {
    await renderScreen();
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));

    // 편집 모드: 순서 변경 핸들과 완료 버튼이 나타난다.
    expect(screen.getByLabelText("디자인 순서 변경")).toBeOnTheScreen();
    expect(screen.getByText("완료")).toBeOnTheScreen();
  });

  test("편집 모드에서 완료를 누르면 일반 모드로 돌아온다", async () => {
    await renderScreen();
    await fireEvent.press(screen.getByLabelText("더보기"));
    await fireEvent.press(screen.getByText("폴더 정렬 편집"));
    await fireEvent.press(screen.getByText("완료"));

    // 일반 모드 복귀: 더보기 버튼이 다시 보이고 핸들은 사라진다.
    expect(screen.getByLabelText("더보기")).toBeOnTheScreen();
    expect(screen.queryByLabelText("디자인 순서 변경")).toBeNull();
  });
});
