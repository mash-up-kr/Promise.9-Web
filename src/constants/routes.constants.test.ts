import {
  archiveDetailHref,
  decodeSharedUrl,
  encodeSharedUrl,
  linkDetailHref,
  moveLinksHref,
  ROUTES,
  shareLoginHandoffPath,
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

  test("공유 URL 을 로그인 후 저장 시트로 잇는 인계 경로는 라우터가 건드리지 못하는 16진수로 나른다", () => {
    const url = "https://toss.tech/a?b=1&c=2";

    expect(shareLoginHandoffPath(url)).toBe(
      `login?next=create-link&share=${encodeSharedUrl(url)}`,
    );
    expect(encodeSharedUrl(url)).toMatch(/^[0-9a-f]+$/);
  });

  test("공유 URL 인코딩은 &·%·한글·해시를 그대로 되살린다", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=abc&t=10s",
      "https://example.com/?q=100%25&x=a+b#frag",
      "https://ko.wikipedia.org/wiki/대한민국",
    ]) {
      expect(decodeSharedUrl(encodeSharedUrl(url))).toBe(url);
    }
  });

  test("공유 URL 파라미터가 문자열이 아니거나 16진수가 아니면 null 이다", () => {
    expect(decodeSharedUrl(undefined)).toBeNull();
    expect(decodeSharedUrl(["61", "62"])).toBeNull();
    expect(decodeSharedUrl("zz")).toBeNull();
    expect(decodeSharedUrl("")).toBeNull();
  });
});
