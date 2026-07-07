import { fireEvent, render, screen } from "@testing-library/react-native";

import { HeaderBackButton } from "./HeaderBackButton";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

describe("HeaderBackButton", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReturnValue(true);
  });

  test("뒤로 가기 label 을 가진 button 으로 렌더한다", async () => {
    await render(<HeaderBackButton />);
    expect(screen.getByRole("button", { name: "뒤로 가기" })).toBeOnTheScreen();
  });

  test("누르면 router.back() 을 호출한다", async () => {
    await render(<HeaderBackButton />);
    fireEvent.press(screen.getByRole("button", { name: "뒤로 가기" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("돌아갈 히스토리가 없으면 홈으로 대체 이동한다 (딥링크·웹 직접 진입)", async () => {
    mockCanGoBack.mockReturnValue(false);
    await render(<HeaderBackButton />);
    fireEvent.press(screen.getByRole("button", { name: "뒤로 가기" }));
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
