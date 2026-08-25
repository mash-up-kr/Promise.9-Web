import { render, screen } from "@testing-library/react-native";

import { Illustration } from "./Illustration";

describe("Illustration", () => {
  test("이름으로 그래픽을 그린다", async () => {
    await render(<Illustration name="empty-link" />);

    expect(screen.getByTestId("illustration-empty-link")).toBeOnTheScreen();
  });

  test("시안 기본 크기는 200 이고 필요하면 줄일 수 있다", async () => {
    await render(<Illustration name="error" size={80} />);

    expect(screen.getByTestId("illustration-error").props.style).toEqual(
      expect.objectContaining({ width: 80, height: 80 }),
    );
  });
});
