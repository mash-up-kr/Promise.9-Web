import { render, screen } from "@testing-library/react-native";

import { Spinner } from "./Spinner";

describe("Spinner", () => {
  test("progressbar 역할로 조회된다", async () => {
    await render(<Spinner />);
    expect(screen.getByRole("progressbar")).toBeOnTheScreen();
  });
});
