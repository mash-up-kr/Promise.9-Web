const FIRST_WEB_URL_PATTERN = /https?:\/\/\S+/i;
const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):(.*)$/i;
// 스킴 없이 입력한 주소(naver.me/abc · www.a.co.kr:8080/x) — 마지막 라벨이 영문 2자 이상이어야 한다.
const BARE_HOST_URL_PATTERN =
  /^[^\s./?#:@]+(?:\.[^\s./?#:@]+)*\.[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i;
const WEB_URL_PATTERN =
  /^https?:\/\/(?:[^/?#@]*@)?(?:\[[0-9a-f:.]+\]|[^/?#@:[\]]+)(?::\d*)?(?:[/?#].*)?$/i;

// 저장·열기 모두에서 막는다 — 스크립트를 실행하거나 기기·브라우저의 로컬 자원에 접근하는 스킴.
const BLOCKED_SCHEMES = new Set([
  "javascript",
  "vbscript",
  "data",
  "blob",
  "file",
  "filesystem",
  "about",
  "view-source",
]);

function hasWhitespaceOrControl(value: string): boolean {
  if (/\s/.test(value)) return true;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

function splitScheme(value: string): { scheme: string; rest: string } | null {
  const matched = SCHEME_PATTERN.exec(value);
  if (!matched) return null;
  const scheme = matched[1].toLowerCase();
  const rest = matched[2];
  // "naver.me:443/x" 처럼 도메인 뒤 포트는 스킴이 아니다 — 점이 든 스킴은 "://" 로 이어질 때만 인정한다.
  if (scheme.includes(".") && !rest.startsWith("//")) return null;
  return { scheme, rest };
}

/**
 * 저장할 링크로 받을 수 있으면 저장할 형태로 돌려주고, 아니면 null.
 * 스킴 없이 입력한 주소는 https 를 붙이고, 앱 전용 스킴 등 http(s) 외 링크도 허용한다.
 */
export function normalizeLinkUrl(input: string): string | null {
  const value = input.trim();
  if (value === "" || hasWhitespaceOrControl(value)) return null;

  const parts = splitScheme(value);
  if (!parts) {
    return BARE_HOST_URL_PATTERN.test(value) ? `https://${value}` : null;
  }
  if (BLOCKED_SCHEMES.has(parts.scheme)) return null;
  if (parts.scheme === "http" || parts.scheme === "https") {
    return WEB_URL_PATTERN.test(value) ? value : null;
  }
  const body = parts.rest.startsWith("//") ? parts.rest.slice(2) : parts.rest;
  return body.length > 0 ? value : null;
}

/** 서버가 원문(미리보기)을 가져올 수 있는 http(s) 주소인지. */
export function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

// 공유 텍스트는 문장이 섞여 오므로 입력 검증보다 좁게 본다 — "참고:이거"·"사진.jpg" 를 링크로 착각하지 않게,
// 스킴 링크는 "://" 가 있어야 하고 스킴 없는 주소는 경로가 있거나 www. 로 시작해야 한다.
function isLinkInText(token: string): boolean {
  if (!normalizeLinkUrl(token)) return false;
  if (splitScheme(token)) return token.includes("://");
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
