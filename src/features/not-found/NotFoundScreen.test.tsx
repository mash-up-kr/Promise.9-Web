const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: mockReplace }),
}));

let mockAuthStatus = "authenticated";
jest.mock("@/features/auth/hooks/useAuthGate", () => ({
  useAuthGate: () => mockAuthStatus,
}));

import { render, screen, userEvent } from "@testing-library/react-native";

import { NotFoundScreen } from "./NotFoundScreen";

describe("NotFoundScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockAuthStatus = "authenticated";
  });

  test("페이지를 찾을 수 없다는 안내를 렌더한다", async () => {
    await render(<NotFoundScreen />);

    expect(screen.getByText("페이지를 찾을 수 없어요")).toBeOnTheScreen();
    expect(
      screen.getByText("주소가 잘못되었거나 삭제된 페이지예요"),
    ).toBeOnTheScreen();
  });

  // 히스토리를 교체해야 뒤로가기로 404 에 되돌아오지 않는다.
  test("홈으로 가기를 누르면 홈으로 교체 이동한다", async () => {
    const user = userEvent.setup();
    await render(<NotFoundScreen />);

    await user.press(screen.getByRole("button", { name: "홈으로 가기" }));

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  // 홈은 보호 라우트라 로그인 안 된 상태에선 이동 자체가 무시된다.
  test("로그인 안 된 상태면 로그인하러 가기로 로그인에 교체 이동한다", async () => {
    mockAuthStatus = "unauthenticated";
    const user = userEvent.setup();
    await render(<NotFoundScreen />);

    await user.press(screen.getByRole("button", { name: "로그인하러 가기" }));

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(
      screen.queryByRole("button", { name: "홈으로 가기" }),
    ).not.toBeOnTheScreen();
  });
});
