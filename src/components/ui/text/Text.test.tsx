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

  test("bold variant 가 font-pretendard-bold(실제 굵기 폰트)를 적용한다", async () => {
    // 네이티브는 폰트의 weight 축을 지원하지 않아 font-weight 스타일만으로는
    // 굵기가 바뀌지 않는다. 굵기별 static 폰트로 fontFamily 자체를 바꿔야 한다.
    await render(<Text bold>굵게</Text>);
    expect(screen.getByText("굵게").props.className).toContain(
      "font-pretendard-bold",
    );
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

  test("variant(크기)와 기본 색상(text-text-normal)이 함께 적용된다", async () => {
    // text-body-1(폰트크기)·text-text-normal(색상)은 둘 다 text- 접두사라
    // tailwind-merge 가 충돌로 보고 하나를 버리면 안 된다.
    await render(<Text variant="body-1">본문</Text>);
    const cls = screen.getByText("본문").props.className;
    expect(cls).toContain("text-body-1");
    expect(cls).toContain("text-text-normal");
  });

  test("variant 프리셋이 지정된 굵기의 static 폰트(font-pretendard-semibold)를 함께 적용한다 (title → 600)", async () => {
    await render(<Text variant="title">제목</Text>);
    expect(screen.getByText("제목").props.className).toContain(
      "font-pretendard-semibold",
    );
  });

  test("variant 프리셋이 지정된 굵기의 static 폰트(font-pretendard-medium)를 함께 적용한다 (body-2 → 500)", async () => {
    await render(<Text variant="body-2">본문</Text>);
    expect(screen.getByText("본문").props.className).toContain(
      "font-pretendard-medium",
    );
  });

  test("variant(크기)와 색상 override 가 함께 적용된다", async () => {
    await render(
      <Text variant="title" className="text-text-assistive">
        제목
      </Text>,
    );
    const cls = screen.getByText("제목").props.className;
    expect(cls).toContain("text-title");
    expect(cls).toContain("text-text-assistive");
  });
});
