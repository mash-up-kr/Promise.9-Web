jest.mock("expo-router", () => ({
  useRouter: () => ({
    canGoBack: () => true,
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

import { render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import PrivacyRoute from "./privacy";
import TermsRoute from "./terms";

const wrap = (node: ReactNode) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      {node}
    </SafeAreaProvider>,
  );

test("terms 라우트는 약관 화면을 렌더한다", async () => {
  await wrap(<TermsRoute />);
  expect(screen.getByText("서비스 이용약관")).toBeOnTheScreen();
});

test("privacy 라우트는 개인정보 화면을 렌더한다", async () => {
  await wrap(<PrivacyRoute />);
  expect(screen.getByText("개인정보처리방침")).toBeOnTheScreen();
});
