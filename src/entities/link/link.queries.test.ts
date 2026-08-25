jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import { apiClient } from "@shared/api";

import { linkListResponseSchema, linkQueries, toLink } from "./link.queries";

const validItem = {
  linkId: 1,
  title: "제목",
  source: "example.com",
  representativeTag: null,
  thumbnailUrl: null,
  savedAt: "2026-07-26T00:00:00.000Z",
};
const validResponse = {
  links: [validItem],
  pagination: { nextCursor: null, hasNext: false, limit: 9 },
};

describe("toLink", () => {
  it("nullable 한 title·source 를 빈 문자열로 폴백한다", () => {
    expect(
      toLink({
        linkId: 1,
        title: null,
        source: null,
        representativeTag: null,
        thumbnailUrl: null,
        savedAt: "2026-07-26T00:00:00.000Z",
      }),
    ).toEqual({
      linkId: 1,
      title: "",
      source: "",
      representativeTag: null,
      thumbnailUrl: null,
      savedAt: "2026-07-26T00:00:00.000Z",
    });
  });
});

describe("linkListResponseSchema", () => {
  it("정상 응답을 통과시킨다", () => {
    expect(linkListResponseSchema.safeParse(validResponse).success).toBe(true);
  });

  it("대표 태그가 있는 응답을 통과시킨다", () => {
    const withTag = {
      ...validResponse,
      links: [
        {
          ...validItem,
          representativeTag: {
            tagId: 3,
            name: "디자인",
            sourceType: "ai",
            sortOrder: null,
          },
        },
      ],
    };
    expect(linkListResponseSchema.safeParse(withTag).success).toBe(true);
  });

  it("필드 타입이 계약과 다르면 거부한다", () => {
    const wrongType = {
      ...validResponse,
      links: [{ ...validItem, linkId: "1" }],
    };
    expect(linkListResponseSchema.safeParse(wrongType).success).toBe(false);
  });

  it("필수 필드가 빠지면 거부한다", () => {
    const { savedAt: _omitted, ...withoutSavedAt } = validItem;
    expect(
      linkListResponseSchema.safeParse({
        ...validResponse,
        links: [withoutSavedAt],
      }).success,
    ).toBe(false);
  });

  // 서버가 필드를 추가해도 캐시에 그대로 남겨야 응답을 통째로 다시 받지 않고 쓸 수 있다.
  it("계약에 없는 키를 버리지 않고 통과시킨다", () => {
    const parsed = linkListResponseSchema.parse({
      ...validResponse,
      links: [{ ...validItem, memo: "새 필드" }],
    });

    expect(parsed.links[0]).toHaveProperty("memo", "새 필드");
  });

  it("알 수 없는 sourceType 은 거부한다", () => {
    const unknownSource = {
      ...validResponse,
      links: [
        {
          ...validItem,
          representativeTag: {
            tagId: 3,
            name: "디자인",
            sourceType: "unknown",
            sortOrder: null,
          },
        },
      ],
    };
    expect(linkListResponseSchema.safeParse(unknownSource).success).toBe(false);
  });
});

describe("linkQueries.list", () => {
  it("params 가 다르면 다른 queryKey 를 만든다", () => {
    expect(linkQueries.list({ folderId: 3 }).queryKey).not.toEqual(
      linkQueries.list({ sortBy: "savedAt", limit: 9 }).queryKey,
    );
  });

  it("queryKey 가 링크 도메인 키 아래에 있다", () => {
    const [root] = linkQueries.keys.root();

    expect(linkQueries.list({ folderId: 3 }).queryKey[0]).toBe(root);
  });

  // 서버가 화면별 엔드포인트를 두지 않으므로, 화면 차이는 전부 params 로만 표현된다.
  it("queryFn 이 /links 에 params 를 그대로 넘긴다", async () => {
    jest
      .mocked(apiClient.get)
      .mockResolvedValue({ data: { data: validResponse } });
    const params = { sortBy: "savedAt", order: "desc", limit: 9 } as const;
    const { queryFn } = linkQueries.list(params);
    const signal = new AbortController().signal;

    await (queryFn as (ctx: { signal: AbortSignal }) => Promise<unknown>)({
      signal,
    });

    expect(apiClient.get).toHaveBeenCalledWith("/links", { params, signal });
  });

  it("select 가 응답을 UI Link 목록으로 변환한다", () => {
    const { select } = linkQueries.list({ folderId: 3 });

    expect(select?.(validResponse)).toEqual([
      {
        linkId: 1,
        title: "제목",
        source: "example.com",
        representativeTag: null,
        thumbnailUrl: null,
        savedAt: "2026-07-26T00:00:00.000Z",
      },
    ]);
  });

  // select 신원이 렌더마다 바뀌면 react-query 가 매번 재계산한다.
  it("select 는 호출마다 같은 참조를 유지한다", () => {
    expect(linkQueries.list({ folderId: 3 }).select).toBe(
      linkQueries.list({ favorite: true }).select,
    );
  });
});
