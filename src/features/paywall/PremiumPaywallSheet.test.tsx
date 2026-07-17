import { fireEvent, render, screen } from "@testing-library/react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockShow = jest.fn();
jest.mock("@/components/ui/snackbar/SnackbarProvider", () => ({
  useSnackbar: () => ({ show: mockShow, hide: jest.fn() }),
}));

import { PremiumPaywallSheet } from "./PremiumPaywallSheet";

describe("PremiumPaywallSheet", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockShow.mockClear();
  });

  test("결제 유도 카피와 버튼을 렌더한다", async () => {
    await render(<PremiumPaywallSheet onDismiss={jest.fn()} />);
    expect(screen.getByText("Pro 전용 기능이에요")).toBeOnTheScreen();
    expect(screen.getByText("Pro 시작하기")).toBeOnTheScreen();
  });

  test("'Pro 시작하기'를 누르면 이스터에그 스낵바를 띄우고 닫는다", async () => {
    const onDismiss = jest.fn();
    await render(<PremiumPaywallSheet onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByText("Pro 시작하기"));
    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockShow.mock.calls[0][0].message).toContain("이스터에그");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("'다음에 할게요'를 누르면 홈으로 이동하고 닫는다", async () => {
    const onDismiss = jest.fn();
    await render(<PremiumPaywallSheet onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByText("다음에 할게요"));
    expect(mockReplace).toHaveBeenCalledWith("/");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("닫기 버튼을 누르면 onDismiss 를 호출한다", async () => {
    const onDismiss = jest.fn();
    await render(<PremiumPaywallSheet onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByLabelText("닫기"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
