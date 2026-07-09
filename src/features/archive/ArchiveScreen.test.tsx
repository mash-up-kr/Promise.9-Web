import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ArchiveScreen } from "./ArchiveScreen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// 공통 Header 가 useSafeAreaInsets 를 쓰므로 인셋을 동기 제공하는 Provider 로 감싼다.
const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      {children}
    </SafeAreaProvider>
  );
}

const renderScreen = () => render(<ArchiveScreen />, { wrapper: Wrapper });

describe("ArchiveScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test("헤더 타이틀 '보관함' 을 렌더한다", async () => {
    await renderScreen();
    expect(screen.getByText("보관함")).toBeOnTheScreen();
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

  test("검색 버튼을 누르면 검색 화면으로 이동한다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText("검색"));
    expect(mockPush).toHaveBeenCalledWith("/search");
  });

  test("더보기 버튼을 누르면 편집·정렬 메뉴가 노출된다", async () => {
    await renderScreen();
    expect(screen.queryByText("편집")).not.toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("더보기"));

    expect(await screen.findByText("편집")).toBeOnTheScreen();
    expect(screen.getByText("정렬")).toBeOnTheScreen();
  });

  test("메뉴 항목을 누르면 메뉴가 닫힌다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText("더보기"));
    fireEvent.press(await screen.findByText("편집"));
    await waitFor(() =>
      expect(screen.queryByText("편집")).not.toBeOnTheScreen(),
    );
  });

  test("더보기 버튼을 다시 누르면 메뉴가 닫힌다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText("더보기"));
    await screen.findByText("편집");
    fireEvent.press(screen.getByLabelText("더보기"));
    await waitFor(() =>
      expect(screen.queryByText("편집")).not.toBeOnTheScreen(),
    );
  });

  test("메뉴 바깥을 누르면 메뉴가 닫힌다", async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText("더보기"));
    await screen.findByText("편집");
    fireEvent.press(screen.getByTestId("archive-more-backdrop"));
    await waitFor(() =>
      expect(screen.queryByText("편집")).not.toBeOnTheScreen(),
    );
  });
});
