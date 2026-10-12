import {
  createLinkSchema,
  linkDetailFormSchema,
  linkUrlSchema,
} from "./link.contracts";

// 규칙 자체(허용·차단 스킴, 보정)는 shared/link/link.utils.test.ts 가 검증한다 — 여기선 스키마 연결만 본다.
describe("linkUrlSchema", () => {
  test("http·https 주소는 그대로 통과시킨다", () => {
    expect(
      linkUrlSchema.safeParse("https://mash-up.co.kr/articles/123"),
    ).toEqual({ success: true, data: "https://mash-up.co.kr/articles/123" });
  });

  test("스킴 없이 입력한 주소는 https 를 붙인 값으로 돌려준다", () => {
    expect(linkUrlSchema.safeParse("naver.me/xYz1")).toEqual({
      success: true,
      data: "https://naver.me/xYz1",
    });
  });

  test("앱 전용 스킴 링크를 통과시킨다", () => {
    expect(linkUrlSchema.safeParse("nmap://place?id=123").success).toBe(true);
  });

  test("거부하면 사유별 안내 문구를 오류 메시지로 준다", () => {
    const cases: [string, string][] = [
      ["not-a-url", "올바른 링크 주소가 아니에요"],
      ["javascript:alert(1)", "보안상 저장할 수 없는 형식의 링크예요"],
      ["https://example.com/a b", "링크 주소에 공백이 들어 있어요"],
      [
        `https://exa${String.fromCodePoint(0x200b)}mple.com`,
        "링크 주소에 보이지 않는 문자가 섞여 있어요",
      ],
      [
        "https://toss.tech@evil.com",
        "보안상 계정 정보(@)가 담긴 링크는 저장할 수 없어요",
      ],
      [
        `https://example.com/${"a".repeat(2048)}`,
        "링크 주소는 최대 2,048자까지 저장할 수 있어요",
      ],
    ];
    for (const [value, message] of cases) {
      const result = linkUrlSchema.safeParse(value);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(message);
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
    reminder: null,
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
