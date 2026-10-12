import { describe, expect, it } from "vitest";

import { getSavableUrl } from "./savableUrl";

const savable = (url: string) => ({ ok: true, url });
// 사유가 null 이면 안내 화면이 기본 문구(브라우저 내부 페이지 등)를 쓴다.
const restricted = (reason: string | null = null) => ({ ok: false, reason });

describe("getSavableUrl", () => {
  it("일반 웹 페이지는 저장할 수 있다", () => {
    for (const url of [
      "https://toss.tech/article/50893",
      "http://example.com",
      "https://example.com/a?b=c#d",
    ]) {
      expect(getSavableUrl(url)).toEqual(savable(url));
    }
  });

  it("앱과 같은 규칙으로 다듬은 주소를 저장한다", () => {
    expect(getSavableUrl(" https://toss.tech/a ")).toEqual(
      savable("https://toss.tech/a"),
    );
  });

  it("브라우저 내부 페이지는 저장할 수 없다", () => {
    // 확장이 URL 을 읽을 수 없거나, 읽어도 서버가 가져올 수 없는 주소들.
    for (const url of [
      "chrome://extensions",
      "chrome://newtab/",
      "chrome-extension://abcdef/popup.html",
      "about:blank",
      "edge://settings",
      "devtools://devtools/bundled/inspector.html",
      "view-source:https://example.com",
      "file:///Users/me/note.html",
    ]) {
      expect(getSavableUrl(url)).toEqual(restricted());
    }
  });

  it("크롬 웹 스토어는 저장할 수 없다", () => {
    // 웹 스토어 도메인에서는 확장 동작 자체가 차단된다.
    expect(
      getSavableUrl("https://chromewebstore.google.com/detail/abc/xyz"),
    ).toEqual(restricted());
    expect(
      getSavableUrl("https://chrome.google.com/webstore/detail/abc"),
    ).toEqual(restricted());
  });

  it("PDF 는 저장할 수 없다", () => {
    expect(getSavableUrl("https://example.com/report.pdf")).toEqual(
      restricted(),
    );
    // 확장자 대소문자·쿼리스트링과 무관하게 경로만 본다.
    expect(getSavableUrl("https://example.com/a/REPORT.PDF?page=2")).toEqual(
      restricted(),
    );
    // 경로가 아니라 쿼리에 들어 있는 .pdf 는 PDF 페이지가 아니다.
    expect(getSavableUrl("https://example.com/search?q=report.pdf").ok).toBe(
      true,
    );
  });

  it("URL 이 없거나 형식이 깨졌으면 저장할 수 없다", () => {
    expect(getSavableUrl(undefined)).toEqual(restricted());
    expect(getSavableUrl("")).toEqual(restricted());
    expect(getSavableUrl("not a url")).toEqual(restricted());
  });

  // 거부 사유는 안내 화면에 그대로 보여준다.
  it("앱의 링크 저장 규칙에 어긋나면 그 사유와 함께 저장할 수 없다", () => {
    expect(getSavableUrl("https://toss.tech@evil.com/login")).toEqual(
      restricted("userinfo"),
    );
    expect(getSavableUrl(`https://example.com/${"a".repeat(2048)}`)).toEqual(
      restricted("too-long"),
    );
  });
});
