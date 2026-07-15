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
});
