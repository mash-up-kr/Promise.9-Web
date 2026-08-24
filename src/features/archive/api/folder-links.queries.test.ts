jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import { linkQueries } from "@/entities/link/link.queries";

import {
  folderLinkQueries,
  isFolderRouteId,
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
  const latest = { sortBy: "savedAt", order: "desc" };

  it("시스템 폴더 id 를 /links 필터로 매핑한다", () => {
    expect(toLinkListParams("all")).toEqual(latest);
    expect(toLinkListParams("uncategorized")).toEqual({
      unassigned: true,
      ...latest,
    });
    expect(toLinkListParams("favorites")).toEqual({
      favorite: true,
      ...latest,
    });
  });

  it("사용자 폴더(숫자 id)는 folderId 로 매핑한다", () => {
    expect(toLinkListParams("7")).toEqual({ folderId: 7, ...latest });
  });

  it("정렬을 지정하지 않으면 최신순이다", () => {
    expect(toLinkListParams("all")).toEqual(toLinkListParams("all", "latest"));
  });

  it("오래된 순은 order 를 asc 로 보낸다", () => {
    expect(toLinkListParams("7", "oldest")).toEqual({
      folderId: 7,
      sortBy: "savedAt",
      order: "asc",
    });
  });

  // 서버는 deleted=true 목록만 deletedAt 으로 정렬할 수 있고, 저장 시각으로는 정렬하지 않는다.
  it("최근 삭제 폴더는 삭제 시각으로 정렬한다", () => {
    expect(toLinkListParams("trash")).toEqual({
      deleted: true,
      sortBy: "deletedAt",
      order: "desc",
    });
    expect(toLinkListParams("trash", "oldest")).toEqual({
      deleted: true,
      sortBy: "deletedAt",
      order: "asc",
    });
  });
});

describe("folderLinkQueries.list", () => {
  it("라우트 id 를 params 로 바꿔 링크 목록 쿼리에 위임한다", () => {
    expect(folderLinkQueries.list("favorites").queryKey).toEqual(
      linkQueries.list({ favorite: true, sortBy: "savedAt", order: "desc" })
        .queryKey,
    );
    expect(folderLinkQueries.list("7").queryKey).toEqual(
      linkQueries.list({ folderId: 7, sortBy: "savedAt", order: "desc" })
        .queryKey,
    );
  });

  // 정렬이 키에 없으면 최신순 캐시가 오래된 순 화면에 그대로 재사용된다.
  it("정렬이 다르면 다른 쿼리 키를 쓴다", () => {
    expect(folderLinkQueries.list("7", "latest").queryKey).not.toEqual(
      folderLinkQueries.list("7", "oldest").queryKey,
    );
  });
});
