import { createLinkSchema } from "./link.contracts";

describe("createLinkSchema", () => {
  test("유효한 입력을 통과시킨다", () => {
    const result = createLinkSchema.safeParse({
      url: "https://example.com",
      remindType: "soon",
      memo: "메모",
    });
    expect(result.success).toBe(true);
  });

  test("잘못된 URL 을 거부한다", () => {
    const result = createLinkSchema.safeParse({
      url: "not-a-url",
      remindType: "soon",
    });
    expect(result.success).toBe(false);
  });

  test("http/https 이외의 스킴을 거부한다", () => {
    const cases = [
      "file:///Users/boky/Downloads/secret.pdf",
      "javascript:alert(1)",
      "ftp://example.com/file",
      "chrome://settings",
      "data:text/html,<script>alert(1)</script>",
    ];
    for (const url of cases) {
      const result = createLinkSchema.safeParse({ url, remindType: "soon" });
      expect(result.success).toBe(false);
    }
  });

  test("http 와 https 는 허용한다", () => {
    for (const url of [
      "http://example.com",
      "https://mash-up.co.kr/articles/123",
    ]) {
      const result = createLinkSchema.safeParse({ url, remindType: "soon" });
      expect(result.success).toBe(true);
    }
  });

  test("remindType 누락을 거부한다", () => {
    const result = createLinkSchema.safeParse({ url: "https://example.com" });
    expect(result.success).toBe(false);
  });

  test("메모가 최대 길이를 넘으면 거부한다", () => {
    const result = createLinkSchema.safeParse({
      url: "https://example.com",
      remindType: "soon",
      memo: "가".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});
