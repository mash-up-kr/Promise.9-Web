import {
  archiveDetailHref,
  linkDetailHref,
  moveLinksHref,
  ROUTES,
} from "./routes.constants";

describe("routes.constants", () => {
  test("정적 경로는 실제 라우트 파일 경로와 일치한다", () => {
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.SEARCH).toBe("/search");
    expect(ROUTES.CREATE_LINK).toBe("/create-link");
    expect(ROUTES.ARCHIVE).toBe("/archive");
    expect(ROUTES.SETTINGS).toBe("/settings");
    expect(ROUTES.LOGIN).toBe("/login");
  });

  test("archiveDetailHref 는 id 를 params 로 담은 Href 를 만든다", () => {
    expect(archiveDetailHref("folder-1")).toEqual({
      pathname: "/archive/[id]",
      params: { id: "folder-1" },
    });
  });

  test("moveLinksHref 는 링크 id 를 쉼표로 이어 붙인다", () => {
    expect(moveLinksHref([42, 43])).toEqual({
      pathname: "/move-links",
      params: { ids: "42,43" },
    });
  });

  // 원래 폴더를 알면 시트가 그 폴더를 미리 골라둔 채로 열린다.
  test("moveLinksHref 는 현재 폴더를 함께 담는다", () => {
    expect(moveLinksHref([42], "7")).toEqual({
      pathname: "/move-links",
      params: { ids: "42", folderId: "7" },
    });
  });

  test("linkDetailHref 는 id 를 params 로 담은 Href 를 만든다", () => {
    expect(linkDetailHref("link-1")).toEqual({
      pathname: "/link/[id]",
      params: { id: "link-1" },
    });
  });
});
