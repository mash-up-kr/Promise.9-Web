import { describe, expect, it } from "vitest";

import { isSavableUrl } from "./savableUrl";

describe("isSavableUrl", () => {
  it("일반 웹 페이지는 저장할 수 있다", () => {
    expect(isSavableUrl("https://toss.tech/article/50893")).toBe(true);
    expect(isSavableUrl("http://example.com")).toBe(true);
    expect(isSavableUrl("https://example.com/a?b=c#d")).toBe(true);
  });

  it("브라우저 내부 페이지는 저장할 수 없다", () => {
    // 확장이 URL 을 읽을 수 없거나, 읽어도 서버가 가져올 수 없는 주소들.
    expect(isSavableUrl("chrome://extensions")).toBe(false);
    expect(isSavableUrl("chrome://newtab/")).toBe(false);
    expect(isSavableUrl("chrome-extension://abcdef/popup.html")).toBe(false);
    expect(isSavableUrl("about:blank")).toBe(false);
    expect(isSavableUrl("edge://settings")).toBe(false);
    expect(isSavableUrl("devtools://devtools/bundled/inspector.html")).toBe(
      false,
    );
    expect(isSavableUrl("view-source:https://example.com")).toBe(false);
    expect(isSavableUrl("file:///Users/me/note.html")).toBe(false);
  });

  it("크롬 웹 스토어는 저장할 수 없다", () => {
    // 웹 스토어 도메인에서는 확장 동작 자체가 차단된다.
    expect(
      isSavableUrl("https://chromewebstore.google.com/detail/abc/xyz"),
    ).toBe(false);
    expect(isSavableUrl("https://chrome.google.com/webstore/detail/abc")).toBe(
      false,
    );
  });

  it("PDF 는 저장할 수 없다", () => {
    expect(isSavableUrl("https://example.com/report.pdf")).toBe(false);
    // 확장자 대소문자·쿼리스트링과 무관하게 경로만 본다.
    expect(isSavableUrl("https://example.com/a/REPORT.PDF?page=2")).toBe(false);
    // 경로가 아니라 쿼리에 들어 있는 .pdf 는 PDF 페이지가 아니다.
    expect(isSavableUrl("https://example.com/search?q=report.pdf")).toBe(true);
  });

  it("URL 이 없거나 형식이 깨졌으면 저장할 수 없다", () => {
    expect(isSavableUrl(undefined)).toBe(false);
    expect(isSavableUrl("")).toBe(false);
    expect(isSavableUrl("not a url")).toBe(false);
  });
});
