import {
  createLinkSchema,
  linkDetailFormSchema,
  linkUrlSchema,
} from "./link.contracts";

describe("linkUrlSchema", () => {
  test("http 와 https 는 허용한다", () => {
    for (const url of [
      "http://example.com",
      "https://mash-up.co.kr/articles/123",
    ]) {
      expect(linkUrlSchema.safeParse(url).success).toBe(true);
    }
  });

  test("URL 형식이 아니면 거부한다", () => {
    expect(linkUrlSchema.safeParse("not-a-url").success).toBe(false);
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
      expect(linkUrlSchema.safeParse(url).success).toBe(false);
    }
  });
});

describe("createLinkSchema", () => {
  const validForm = {
    url: "https://example.com",
    folderId: null,
    reminder: null,
    memo: "메모",
    previewUrl: "https://example.com",
  };

  test("유효한 폼을 통과시킨다", () => {
    expect(createLinkSchema.safeParse(validForm).success).toBe(true);
  });

  test("URL 이 비어 있으면(트림 후) 거부한다", () => {
    expect(createLinkSchema.safeParse({ ...validForm, url: "" }).success).toBe(
      false,
    );
    expect(
      createLinkSchema.safeParse({ ...validForm, url: "   " }).success,
    ).toBe(false);
  });

  // 시안 정책: 저장 버튼 활성화는 형식 무관 — URL 형식 검증은 저장 시점에 linkUrlSchema 로 따로 한다.
  test("URL 형식이 아니어도 비어있지만 않으면 통과시킨다", () => {
    expect(
      createLinkSchema.safeParse({ ...validForm, url: "abc" }).success,
    ).toBe(true);
  });

  test("folderId 는 null 이거나 숫자다", () => {
    expect(
      createLinkSchema.safeParse({ ...validForm, folderId: 3 }).success,
    ).toBe(true);
    expect(
      createLinkSchema.safeParse({ ...validForm, folderId: null }).success,
    ).toBe(true);
  });

  test("reminder 는 null 이거나 ReminderValue 다", () => {
    expect(
      createLinkSchema.safeParse({
        ...validForm,
        reminder: { date: "2026-09-01", hour: 9, minute: 0 },
      }).success,
    ).toBe(true);
    expect(
      createLinkSchema.safeParse({ ...validForm, reminder: null }).success,
    ).toBe(true);
  });

  test("메모가 최대 길이를 넘으면 거부한다", () => {
    const result = createLinkSchema.safeParse({
      ...validForm,
      memo: "가".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});

// 링크 상세 화면 = 링크 하나를 편집하는 폼 하나. 필드: folder · memo · isFavorite.
describe("linkDetailFormSchema", () => {
  const validForm = {
    folder: { folderId: 1, folderName: "디자인" },
    memo: "메모",
    isFavorite: false,
  };

  test("유효한 폼을 통과시킨다", () => {
    expect(linkDetailFormSchema.safeParse(validForm).success).toBe(true);
  });

  test("folder 가 null(미분류)이어도 통과시킨다", () => {
    const result = linkDetailFormSchema.safeParse({
      ...validForm,
      folder: null,
    });
    expect(result.success).toBe(true);
  });

  test("빈 메모를 통과시킨다", () => {
    const result = linkDetailFormSchema.safeParse({
      ...validForm,
      memo: "",
    });
    expect(result.success).toBe(true);
  });

  test("메모가 최대 길이를 넘으면 거부한다", () => {
    const result = linkDetailFormSchema.safeParse({
      ...validForm,
      memo: "가".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});
