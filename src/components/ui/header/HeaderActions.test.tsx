import { render, screen } from "@testing-library/react-native";

import { HeaderActions } from "./HeaderActions";

describe("HeaderActions", () => {
  test("검색·더보기 button 을 렌더한다", async () => {
    await render(<HeaderActions />);
    expect(screen.getByRole("button", { name: "검색" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "더보기" })).toBeOnTheScreen();
  });
});
