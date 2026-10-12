import {
  type LinkUrlRejectReason,
  normalizeLinkUrl,
} from "@shared/link/link.utils";

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

/** 저장할 수 있으면 저장할 형태의 주소, 없으면 안내할 사유 — 사유가 null 이면 기본 안내(브라우저 내부 페이지 등). */
export type SavableUrl =
  | { ok: true; url: string }
  | { ok: false; reason: LinkUrlRejectReason | null };

const RESTRICTED: SavableUrl = { ok: false, reason: null };

/**
 * 이 URL 을 링띵동에 저장할 수 있는지.
 *
 * 저장할 수 없는 페이지(브라우저 내부 페이지·웹 스토어·PDF, 앱의 링크 저장 규칙에 어긋나는 주소)에서는
 * 패널이 저장 화면 대신 안내 화면을 띄운다 — 시안 `chrome-extension / restricted-url`.
 */
export function getSavableUrl(url: string | undefined): SavableUrl {
  if (!url) return RESTRICTED;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return RESTRICTED;
  }

  if (!SAVABLE_PROTOCOLS.has(parsed.protocol)) return RESTRICTED;
  if (isWebStore(parsed) || isPdf(parsed)) return RESTRICTED;

  // 앱과 같은 저장 규칙(계정 정보·길이 등)을 따르고, 저장은 보정한 주소로 한다.
  return normalizeLinkUrl(url);
}
