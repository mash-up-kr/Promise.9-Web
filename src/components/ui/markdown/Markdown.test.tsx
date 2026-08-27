import { render, screen } from "@testing-library/react-native";

import { Markdown } from "./Markdown";

describe("Markdown", () => {
  test("제목과 본문을 렌더한다", async () => {
    await render(
      <Markdown>{"## 제1조 (목적)\n이 약관은 목적을 정한다."}</Markdown>,
    );
    expect(screen.getByText("제1조 (목적)")).toBeOnTheScreen();
    expect(screen.getByText("이 약관은 목적을 정한다.")).toBeOnTheScreen();
  });

  test("빈 문자열이면 예외 없이 렌더한다", async () => {
    await render(<Markdown>{""}</Markdown>);
    expect(screen.toJSON()).not.toBeNull();
  });
});
