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
import { SupportScreen } from "./SupportScreen";
import { SUPPORT_EMAIL } from "./settings.constants";

const renderScreen = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <SupportScreen />
    </SafeAreaProvider>,
  );

describe("SupportScreen", () => {
  test("제목과 문의 이메일을 보여준다", async () => {
    await renderScreen();
    expect(screen.getByText("고객지원")).toBeOnTheScreen();
    expect(screen.getByText(new RegExp(SUPPORT_EMAIL))).toBeOnTheScreen();
  });

  // 스토어 심사가 지원 URL 에서 기대하는 항목 — 문의 창구와 계정 삭제 경로.
  test("계정 삭제 안내와 약관·방침 링크를 담는다", async () => {
    await renderScreen();
    expect(screen.getByText(/회원 탈퇴/)).toBeOnTheScreen();
    expect(screen.getByText(/개인정보처리방침/)).toBeOnTheScreen();
  });

  // 리마인드가 기기 알림이라는 오해를 지원 문서에서도 막는다(심사 문구 정합성).
  test("리마인드가 이메일로 간다고 밝힌다", async () => {
    await renderScreen();
    expect(screen.getByText(/이메일로 보내드립니다/)).toBeOnTheScreen();
  });
});
