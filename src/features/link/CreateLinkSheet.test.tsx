import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("expo-clipboard", () => ({
  hasStringAsync: jest.fn().mockResolvedValue(false),
  getStringAsync: jest.fn().mockResolvedValue(""),
}));

import { CreateLinkSheet } from "./CreateLinkSheet";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderSheet = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CreateLinkSheet />
    </SafeAreaProvider>,
  );

describe("CreateLinkSheet", () => {
  beforeEach(() => mockBack.mockClear());

  test("URL·리마인드 미충족이면 저장 버튼이 비활성이다", async () => {
    await renderSheet();
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(true);
  });

  test("URL+리마인드 충족 시 저장이 활성화되고 저장하면 시트를 닫는다", async () => {
    await renderSheet();
    await fireEvent.changeText(
      screen.getByPlaceholderText("URL"),
      "https://example.com",
    );
    await fireEvent.press(screen.getByText("곧 활용할게요"));
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

  test("클립보드에 문자열이 있으면 붙여넣기 버튼을 노출한다", async () => {
    const Clipboard = jest.requireMock("expo-clipboard");
    Clipboard.hasStringAsync.mockResolvedValueOnce(true);

    await renderSheet();
    await waitFor(() => expect(screen.getByText("붙여넣기")).toBeTruthy());
  });

  test("클립보드가 비어 있으면 붙여넣기 버튼을 숨긴다", async () => {
    await renderSheet();
    expect(screen.queryByText("붙여넣기")).toBeNull();
  });

  test("붙여넣기를 누르면 클립보드의 URL 이 입력된다", async () => {
    const Clipboard = jest.requireMock("expo-clipboard");
    Clipboard.hasStringAsync.mockResolvedValueOnce(true);
    Clipboard.getStringAsync.mockResolvedValueOnce("https://example.com");

    await renderSheet();
    await waitFor(() => expect(screen.getByText("붙여넣기")).toBeTruthy());
    await fireEvent.press(screen.getByText("붙여넣기"));
    await waitFor(() =>
      expect(screen.getByPlaceholderText("URL").props.value).toBe(
        "https://example.com",
      ),
    );
  });

  test("클립보드 읽기가 실패해도 크래시 없이 console.error 로만 남긴다", async () => {
    const Clipboard = jest.requireMock("expo-clipboard");
    const error = new Error("clipboard denied");
    Clipboard.hasStringAsync.mockResolvedValueOnce(true);
    Clipboard.getStringAsync.mockRejectedValueOnce(error);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await renderSheet();
    await waitFor(() => expect(screen.getByText("붙여넣기")).toBeTruthy());
    await fireEvent.press(screen.getByText("붙여넣기"));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(error));
    expect(screen.getByPlaceholderText("URL")).toBeTruthy();

    consoleError.mockRestore();
  });
});
