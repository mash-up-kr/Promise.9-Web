import { render, screen } from "@testing-library/react-native";

import { Heading } from "./Heading";

describe("Heading", () => {
  test("자식 텍스트를 header role 로 렌더한다", async () => {
    await render(<Heading>제목</Heading>);
    expect(screen.getByRole("header", { name: "제목" })).toBeOnTheScreen();
  });

  test("size 에 따라 aria-level 이 자동 매핑된다 (2xl → 2)", async () => {
    await render(<Heading size="2xl">제목</Heading>);
    expect(
      screen.getByRole("header", { name: "제목" }).props["aria-level"],
    ).toBe(2);
  });

  test("size 를 생략하면 기본 lg → aria-level 4 가 적용된다", async () => {
    await render(<Heading>기본</Heading>);
    expect(
      screen.getByRole("header", { name: "기본" }).props["aria-level"],
    ).toBe(4);
  });

  test("size 에 따라 크기 클래스가 적용된다 (xl → text-2xl)", async () => {
    await render(<Heading size="xl">큰 제목</Heading>);
    expect(
      screen.getByRole("header", { name: "큰 제목" }).props.className,
    ).toContain("text-2xl");
  });

  test("외부에서 받은 className 을 함께 적용한다", async () => {
    await render(<Heading className="text-red-500">색깔</Heading>);
    expect(
      screen.getByRole("header", { name: "색깔" }).props.className,
    ).toContain("text-red-500");
  });
});
