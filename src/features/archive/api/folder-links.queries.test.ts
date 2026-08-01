jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import {
  folderLinkQueries,
  isFolderRouteId,
  linkListResponseSchema,
  toLink,
  toLinkListParams,
} from "./folder-links.queries";

describe("isFolderRouteId", () => {
  it("시스템 폴더 id 를 허용한다", () => {
    expect(isFolderRouteId("all")).toBe(true);
    expect(isFolderRouteId("uncategorized")).toBe(true);
    expect(isFolderRouteId("favorites")).toBe(true);
    expect(isFolderRouteId("trash")).toBe(true);
  });

  it("양의 정수(사용자 폴더 id)를 허용한다", () => {
    expect(isFolderRouteId("7")).toBe(true);
    expect(isFolderRouteId("120")).toBe(true);
  });

  it("id 가 없거나 숫자로 해석되지 않으면 거부한다", () => {
    expect(isFolderRouteId(undefined)).toBe(false);
    expect(isFolderRouteId("")).toBe(false);
    expect(isFolderRouteId("foo")).toBe(false);
    expect(isFolderRouteId("1.5")).toBe(false);
    expect(isFolderRouteId("-3")).toBe(false);
    expect(isFolderRouteId("0")).toBe(false);
    // Number("") 나 Number(" ") 는 0 이라 NaN 검사만으론 새어나간다.
    expect(isFolderRouteId(" ")).toBe(false);
  });
});

describe("toLinkListParams", () => {
  it("시스템 폴더 id 를 /links 필터로 매핑한다", () => {
    expect(toLinkListParams("all")).toEqual({});
    expect(toLinkListParams("uncategorized")).toEqual({ unassigned: true });
    expect(toLinkListParams("favorites")).toEqual({ favorite: true });
    expect(toLinkListParams("trash")).toEqual({ deleted: true });
  });

  it("사용자 폴더(숫자 id)는 folderId 로 매핑한다", () => {
    expect(toLinkListParams("7")).toEqual({ folderId: 7 });
  });
});

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
  pagination: { nextCursor: null, hasNext: false, limit: 20 },
};

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

describe("folderLinkQueries.list", () => {
  it("select 가 응답을 UI Link 목록으로 변환한다", () => {
    const { select } = folderLinkQueries.list("all");
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
    expect(folderLinkQueries.list("all").select).toBe(
      folderLinkQueries.list("7").select,
    );
  });
});
