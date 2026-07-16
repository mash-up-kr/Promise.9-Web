import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));

import { CreateFolderSheet } from "./CreateFolderSheet";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderSheet = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CreateFolderSheet />
    </SafeAreaProvider>,
  );

describe("CreateFolderSheet", () => {
  beforeEach(() => mockBack.mockClear());

  test("헤더 타이틀을 렌더한다", async () => {
    await renderSheet();
    expect(screen.getByText("새 폴더 만들기")).toBeOnTheScreen();
  });

  test("이름이 비어 있으면 저장 버튼이 비활성이다", async () => {
    await renderSheet();
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(true);
  });

  test("이름을 입력하면 저장이 활성화되고 저장하면 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.changeText(
      screen.getByPlaceholderText("폴더 이름을 입력하세요."),
      "디자인",
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText("저장").props.accessibilityState.disabled,
      ).toBe(false),
    );
    await fireEvent.press(screen.getByLabelText("저장"));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  test("취소하면 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.press(screen.getByText("취소"));
    expect(mockBack).toHaveBeenCalled();
  });
});
