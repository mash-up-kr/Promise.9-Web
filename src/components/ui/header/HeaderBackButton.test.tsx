import { fireEvent, render, screen } from "@testing-library/react-native";

import { HeaderBackButton } from "./HeaderBackButton";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

describe("HeaderBackButton", () => {
  beforeEach(() => mockBack.mockClear());

  test("뒤로 가기 label 을 가진 button 으로 렌더한다", async () => {
    await render(<HeaderBackButton />);
    expect(screen.getByRole("button", { name: "뒤로 가기" })).toBeOnTheScreen();
  });

  test("누르면 router.back() 을 호출한다", async () => {
    await render(<HeaderBackButton />);
    fireEvent.press(screen.getByRole("button", { name: "뒤로 가기" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
