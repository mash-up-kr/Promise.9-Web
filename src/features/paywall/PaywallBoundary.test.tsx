import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SnackbarProvider } from "@/components/ui/snackbar/SnackbarProvider";

import { PaywallBoundary } from "./PaywallBoundary";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

function Boom(): never {
  throw new Error("의도치 않은 에러");
}

const metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderWithin = (child: React.ReactNode) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <SnackbarProvider>
        <PaywallBoundary>{child}</PaywallBoundary>
      </SnackbarProvider>
    </SafeAreaProvider>,
  );

describe("PaywallBoundary", () => {
  test("에러가 없으면 children 을 그대로 렌더한다", async () => {
    await renderWithin(<Text>정상 화면</Text>);
    expect(screen.getByText("정상 화면")).toBeOnTheScreen();
  });

  test("children 이 에러를 던지면 결제 유도 시트를 띄운다", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await renderWithin(<Boom />);
    expect(screen.getByText("Pro 전용 기능이에요")).toBeOnTheScreen();
    expect(screen.getByText("Pro 시작하기")).toBeOnTheScreen();
    spy.mockRestore();
  });
});
