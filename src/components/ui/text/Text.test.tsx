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

  test("기본 텍스트 색상으로 semantic 토큰(text-text-normal)을 적용한다", async () => {
    await render(<Text>기본</Text>);
    expect(screen.getByText("기본").props.className).toContain(
      "text-text-normal",
    );
  });

  test("기본 폰트로 Pretendard(font-pretendard)를 적용한다", async () => {
    await render(<Text>폰트</Text>);
    expect(screen.getByText("폰트").props.className).toContain(
      "font-pretendard",
    );
  });

  test("variant 프리셋이 해당 타이포 유틸리티를 적용한다 (body-1 → text-body-1)", async () => {
    await render(<Text variant="body-1">본문</Text>);
    expect(screen.getByText("본문").props.className).toContain("text-body-1");
  });

  test("variant=caption-1 이 text-caption-1 을 적용한다", async () => {
    await render(<Text variant="caption-1">캡션</Text>);
    expect(screen.getByText("캡션").props.className).toContain(
      "text-caption-1",
    );
  });

  test("variant 사용 시 기본 size(text-base)가 새어 들어가지 않는다", async () => {
    await render(<Text variant="body-1">본문</Text>);
    const cls = screen.getByText("본문").props.className;
    expect(cls).toContain("text-body-1");
    expect(cls).not.toContain("text-base");
  });
});
