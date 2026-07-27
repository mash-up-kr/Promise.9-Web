jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import { toLink, toLinkListParams } from "./folder-links.queries";

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
