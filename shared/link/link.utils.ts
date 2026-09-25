import { z } from "zod";

export type LinkUrlRejectReason =
  | "empty"
  | "not-link"
  | "whitespace"
  | "invisible-char"
  | "blocked-scheme"
  | "userinfo"
  | "too-long";

export type LinkUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: LinkUrlRejectReason };

const MAX_LINK_URL_LENGTH = 2048;

const FIRST_WEB_URL_PATTERN = /https?:\/\/\S+/i;
const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;
// 스킴 없이 입력한 주소(naver.me/abc · www.a.co.kr:8080/x) — 라벨은 영문·숫자·한글·하이픈, 마지막 라벨은 영문 2자 이상.
const BARE_URL_PATTERN =
  /^((?:[a-z0-9가-힣-]+\.)+([a-z]{2,}))(?::\d+)?([/?#].*)?$/i;
// 숫자만 이어지는 "localhost:3000" 은 호스트:포트다 — 전화 링크(tel:12345)만 스킴으로 본다.
const PORT_PATTERN = /^\d+(?:[/?#]|$)/;
const PHONE_SCHEMES = new Set([
  "tel",
  "sms",
  "mms",
  "facetime",
  "facetime-audio",
]);

// 흔한 스킴 오타와 보안 보고서식 무력화 표기(hxxp)는 http(s) 로 고친다.
const WEB_SCHEME_TYPOS = new Map([
  ["ttps", "https"],
  ["htps", "https"],
  ["htttps", "https"],
  ["hhttps", "https"],
  ["hxxps", "https"],
  ["ttp", "http"],
  ["htp", "http"],
  ["hxxp", "http"],
]);

// 저장·열기 모두에서 막는다 — 스크립트 실행, 기기·브라우저 내부 자원 접근, OS 핸들러 호출, 우리 앱 딥링크.
const BLOCKED_SCHEMES = new Set([
  "javascript",
  "vbscript",
  "data",
  "blob",
  "file",
  "filesystem",
  "about",
  "view-source",
  "intent",
  "content",
  "chrome",
  "chrome-extension",
  "chrome-untrusted",
  "devtools",
  "edge",
  "brave",
  "opera",
  "vivaldi",
  "resource",
  "moz-extension",
  "jar",
  "search",
  "search-ms",
  "promise9web",
]);

// 보이지 않거나 글자 방향을 뒤집는 문자 — 화면에 보이는 주소와 실제로 여는 주소를 다르게 만들 수 있다.
// 제어 문자(C0·DEL·C1)·소프트 하이픈·서식/결합 문자·제로폭 문자·방향 제어·한글 채움 문자·BOM·태그 문자.
const INVISIBLE_CHAR_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0, 0x1f],
  [0x7f, 0x9f],
  [0xad, 0xad],
  [0x34f, 0x34f],
  [0x61c, 0x61c],
  [0x115f, 0x1160],
  [0x17b4, 0x17b5],
  [0x180b, 0x180f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x206f],
  [0x3164, 0x3164],
  [0xfeff, 0xfeff],
  [0xffa0, 0xffa0],
  [0xfff9, 0xfffb],
  [0xe0000, 0xe007f],
];

// 서버(POST /links)와 같은 파서(WHATWG URL)로 본다 — 포트 범위·호스트 금지 문자 등.
const urlSchema = z.url();

function getScheme(value: string): string | null {
  return SCHEME_PATTERN.exec(value)?.[1]?.toLowerCase() ?? null;
}

function isBlockedScheme(scheme: string): boolean {
  // ms-settings·ms-msdt 등 Windows 핸들러는 계속 늘어나 접두어로 막는다.
  return BLOCKED_SCHEMES.has(scheme) || scheme.startsWith("ms-");
}

function hasInvisibleChar(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (
      INVISIBLE_CHAR_RANGES.some(([from, to]) => code >= from && code <= to)
    ) {
      return true;
    }
  }
  return false;
}

function fixWebSchemeTypo(value: string): string {
  const typo = /^([a-z]+):\/\//i.exec(value)?.[1];
  const scheme = typo ? WEB_SCHEME_TYPOS.get(typo.toLowerCase()) : undefined;
  return typo && scheme ? scheme + value.slice(typo.length) : value;
}

// "naver.me:443/x"·"localhost:3000" 의 앞부분은 스킴이 아니라 호스트다 —
// 점이 든 스킴은 "://" 로 이어질 때만 스킴으로 본다.
function isHostWithPort(scheme: string, rest: string): boolean {
  if (scheme.includes(".")) return !rest.startsWith("//");
  return PORT_PATTERN.test(rest) && !PHONE_SCHEMES.has(scheme);
}

// 저장할 형태(스킴 보정)로 만든다. 링크 모양이 아니면 null.
function toLinkUrl(value: string, scheme: string | null): string | null {
  const rest = scheme === null ? "" : value.slice(scheme.length + 1);
  if (scheme === null || isHostWithPort(scheme, rest)) {
    return BARE_URL_PATTERN.test(value) ? `https://${value}` : null;
  }
  if (scheme === "http" || scheme === "https") {
    return rest.startsWith("//") ? value : null;
  }
  return rest.replace(/^\/\//, "") === "" ? null : value;
}

// "https://toss.tech@evil.com" 처럼 @ 앞을 도메인으로 착각하게 만드는 계정 정보.
// 브라우저는 "\" 도 경로 구분자로 읽으므로 "/?#" 까지를 통째로 본다.
function hasUserinfo(webUrl: string): boolean {
  const rest = webUrl.slice(webUrl.indexOf("//") + 2);
  const end = rest.search(/[/?#]/);
  return (end === -1 ? rest : rest.slice(0, end)).includes("@");
}

/**
 * 저장할 링크로 받을 수 있으면 저장할 형태로, 아니면 거부 사유를 돌려준다.
 * 스킴 없이 입력한 주소는 https 를 붙이고, 앱 전용 스킴 등 http(s) 외 링크도 허용한다.
 */
export function normalizeLinkUrl(input: string): LinkUrlResult {
  const trimmed = input.trim();
  if (trimmed === "") return { ok: false, reason: "empty" };
  if (trimmed.length > MAX_LINK_URL_LENGTH) {
    return { ok: false, reason: "too-long" };
  }
  const value = fixWebSchemeTypo(trimmed);
  const scheme = getScheme(value);
  if (scheme !== null && isBlockedScheme(scheme)) {
    return { ok: false, reason: "blocked-scheme" };
  }
  if (/\s/.test(value)) return { ok: false, reason: "whitespace" };
  if (hasInvisibleChar(value)) return { ok: false, reason: "invisible-char" };

  const url = toLinkUrl(value, scheme);
  if (url === null) return { ok: false, reason: "not-link" };
  if (isWebUrl(url) && hasUserinfo(url)) {
    return { ok: false, reason: "userinfo" };
  }
  if (!urlSchema.safeParse(url).success) {
    return { ok: false, reason: "not-link" };
  }
  // https 를 붙이거나 오타를 고쳐 길어질 수 있어 보정한 값으로 다시 본다.
  if (url.length > MAX_LINK_URL_LENGTH) {
    return { ok: false, reason: "too-long" };
  }
  return { ok: true, url };
}

/** 서버가 원문(미리보기)을 가져올 수 있는 http(s) 주소인지. */
export function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

// 공유 텍스트는 문장이 섞여 오므로 입력 검증보다 좁게 본다 — "참고:이거"·"사진.jpg" 를 링크로 착각하지 않게,
// 스킴 링크는 "://" 가 있어야 하고 스킴 없는 주소는 경로가 있거나 www. 로 시작해야 한다.
function isLinkInText(token: string): boolean {
  if (!normalizeLinkUrl(token).ok) return false;
  const scheme = getScheme(token);
  if (
    scheme !== null &&
    !isHostWithPort(scheme, token.slice(scheme.length + 1))
  ) {
    return token.includes("://");
  }
  return token.includes("/") || /^www\./i.test(token);
}

/**
 * 공유 텍스트에서 첫 링크를 뽑는다. Android 는 "제목\nURL" 처럼 섞어 보내고,
 * 지도·SNS 앱은 스킴 없는 주소나 앱 전용 링크를 텍스트로 보낸다 — http(s) 를 먼저 찾는다.
 */
export function extractFirstUrl(text: string): string | null {
  const webUrl = FIRST_WEB_URL_PATTERN.exec(text)?.[0];
  if (webUrl) return webUrl;
  return text.split(/\s+/).find(isLinkInText) ?? null;
}
