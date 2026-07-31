jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import {
  isFolderRouteId,
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
