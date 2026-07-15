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
