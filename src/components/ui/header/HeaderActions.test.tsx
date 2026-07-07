import { fireEvent, render, screen } from "@testing-library/react-native";

import { HeaderActions } from "./HeaderActions";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

describe("HeaderActions", () => {
  beforeEach(() => mockNavigate.mockClear());

  test("검색·더보기 button 을 렌더한다", async () => {
    await render(<HeaderActions />);
    expect(screen.getByRole("button", { name: "검색" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "더보기" })).toBeOnTheScreen();
  });

  test("검색 버튼을 누르면 검색 화면으로 이동한다", async () => {
    await render(<HeaderActions />);
    fireEvent.press(screen.getByRole("button", { name: "검색" }));
    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });
});
