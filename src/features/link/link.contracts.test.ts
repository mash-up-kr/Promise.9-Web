import {
  createLinkSchema,
  linkDetailFormSchema,
  MAX_TAGS,
} from "./link.contracts";

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

// 링크 상세 화면 = 링크 하나를 편집하는 폼 하나. 필드: folder · tags · memo · isFavorite.
describe("linkDetailFormSchema", () => {
  const validForm = {
    folder: { folderId: 1, folderName: "디자인" },
    tags: [{ tagId: 1, name: "디자인", sourceType: "ai", sortOrder: 0 }],
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

  test("빈 태그 목록·빈 메모를 통과시킨다", () => {
    const result = linkDetailFormSchema.safeParse({
      ...validForm,
      tags: [],
      memo: "",
    });
    expect(result.success).toBe(true);
  });

  test(`태그가 ${MAX_TAGS}개를 넘으면 거부한다`, () => {
    const tooManyTags = Array.from({ length: MAX_TAGS + 1 }, (_, i) => ({
      tagId: i + 1,
      name: `태그${i}`,
      sourceType: "user",
      sortOrder: i,
    }));
    const result = linkDetailFormSchema.safeParse({
      ...validForm,
      tags: tooManyTags,
    });
    expect(result.success).toBe(false);
  });

  test("메모가 최대 길이를 넘으면 거부한다", () => {
    const result = linkDetailFormSchema.safeParse({
      ...validForm,
      memo: "가".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});
