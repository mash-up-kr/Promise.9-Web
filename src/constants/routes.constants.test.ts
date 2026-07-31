import { archiveDetailHref, linkDetailHref, ROUTES } from "./routes.constants";

describe("routes.constants", () => {
  test("정적 경로는 실제 라우트 파일 경로와 일치한다", () => {
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.SEARCH).toBe("/search");
    expect(ROUTES.SEARCH_CATEGORIES).toBe("/search/categories");
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

  test("linkDetailHref 는 id 를 params 로 담은 Href 를 만든다", () => {
    expect(linkDetailHref("link-1")).toEqual({
      pathname: "/link/[id]",
      params: { id: "link-1" },
    });
  });
});
