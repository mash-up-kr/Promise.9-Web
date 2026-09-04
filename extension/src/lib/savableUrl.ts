/** 저장할 수 있는 스킴. 서버가 원문을 가져올 수 있는 건 http(s) 뿐이다. */
const SAVABLE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * 크롬 웹 스토어. 이 도메인에서는 확장 동작 자체가 브라우저에 의해 차단된다.
 * 신 주소(chromewebstore.google.com)와 구 주소(chrome.google.com/webstore) 둘 다 막는다.
 */
const isWebStore = (url: URL): boolean =>
  url.hostname === "chromewebstore.google.com" ||
  (url.hostname === "chrome.google.com" &&
    url.pathname.startsWith("/webstore"));

/** PDF 뷰어로 열린 페이지. 경로 확장자로만 판단한다(쿼리의 `.pdf` 는 PDF 가 아니다). */
const isPdf = (url: URL): boolean =>
  url.pathname.toLowerCase().endsWith(".pdf");

/**
 * 이 URL 을 링딩동에 저장할 수 있는지.
 *
 * 저장할 수 없는 페이지(브라우저 내부 페이지·웹 스토어·PDF)에서는 패널이 저장 화면 대신
 * 안내 화면을 띄운다 — 시안 `chrome-extension / restricted-url`.
 */
export function isSavableUrl(url: string | undefined): url is string {
  if (!url) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!SAVABLE_PROTOCOLS.has(parsed.protocol)) return false;

  return !isWebStore(parsed) && !isPdf(parsed);
}
