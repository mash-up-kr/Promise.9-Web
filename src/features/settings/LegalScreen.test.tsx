jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({
    canGoBack: () => true,
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LegalScreen } from "./LegalScreen";

const renderScreen = (kind: "terms" | "privacy") =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <LegalScreen kind={kind} />
    </SafeAreaProvider>,
  );

describe("LegalScreen", () => {
  test("약관 제목과 본문 조항을 렌더한다", async () => {
    await renderScreen("terms");
    expect(screen.getByText("서비스 이용약관")).toBeOnTheScreen();
    expect(screen.getByText("제1조 (목적)")).toBeOnTheScreen();
  });

  test("개인정보 제목과 본문 조항을 렌더한다", async () => {
    await renderScreen("privacy");
    expect(screen.getByText("개인정보처리방침")).toBeOnTheScreen();
    expect(
      screen.getByText("제1조 (수집하는 개인정보 항목)"),
    ).toBeOnTheScreen();
  });
});
