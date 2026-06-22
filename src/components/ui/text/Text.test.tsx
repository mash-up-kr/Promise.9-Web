import { render, screen } from "@testing-library/react-native";

import { Text } from "./Text";

describe("Text", () => {
  test("자식을 텍스트로 렌더한다", async () => {
    await render(<Text>안녕</Text>);
    expect(screen.getByText("안녕")).toBeOnTheScreen();
  });

  test("외부에서 받은 className 을 함께 적용한다", async () => {
    await render(<Text className="text-red-500">색깔</Text>);
    expect(screen.getByText("색깔").props.className).toContain("text-red-500");
  });

  test("bold variant 가 font-bold 를 적용한다", async () => {
    await render(<Text bold>굵게</Text>);
    expect(screen.getByText("굵게").props.className).toContain("font-bold");
  });

  test("size variant 에 따라 사이즈 클래스가 적용된다", async () => {
    await render(<Text size="lg">큰</Text>);
    expect(screen.getByText("큰").props.className).toContain("text-lg");
  });

  test("size 를 생략하면 기본 md 가 적용된다", async () => {
    await render(<Text>기본</Text>);
    expect(screen.getByText("기본").props.className).toContain("text-base");
  });
});
