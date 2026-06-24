import { render, screen } from "@testing-library/react-native";

import { Heading, headingStyles } from "./Heading";

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

  // 스타일 클래스 매핑은 headingStyles(tv) 로직을 직접 검증한다.
  // jest 에는 NativeWind className→style 해석기가 없어 렌더 결과(style)로는 검증할 수 없고,
  // 실제 적용 스타일(font-weight/size)은 device·web 으로 확인한다.
  describe("headingStyles", () => {
    test("size 에 따라 크기 클래스가 적용된다 (xl → text-2xl)", () => {
      expect(headingStyles({ size: "xl" })).toContain("text-2xl");
    });

    test("외부에서 받은 className 을 함께 병합한다", () => {
      expect(headingStyles({ class: "text-red-500" })).toContain(
        "text-red-500",
      );
    });

    test("기본적으로 볼드(font-bold)가 적용된다", () => {
      expect(headingStyles({})).toContain("font-bold");
    });

    test("기본 텍스트 색상으로 semantic 토큰(text-text-strong)을 적용한다", () => {
      expect(headingStyles({})).toContain("text-text-strong");
    });

    test("기본 폰트로 Pretendard(font-pretendard)를 적용한다", () => {
      expect(headingStyles({})).toContain("font-pretendard");
    });

    test("bold={false} 면 font-normal 이 적용되고 font-bold 는 빠진다", () => {
      const result = headingStyles({ bold: false });
      expect(result).toContain("font-normal");
      expect(result).not.toContain("font-bold");
    });
  });
});
