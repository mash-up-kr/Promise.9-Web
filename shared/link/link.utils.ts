import { z } from "zod";

export type LinkUrlRejectReason =
  | "empty"
  | "not-link"
  | "whitespace"
  | "invisible-char"
  | "blocked-scheme"
  | "userinfo"
  | "too-long"
  // 공유 텍스트에서 링크를 하나도 찾지 못함(findLinkInText 전용)
  | "not-found";

export type LinkUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: LinkUrlRejectReason };

const MAX_LINK_URL_LENGTH = 2048;
// 공유 텍스트는 앞부분만 본다 — 아주 긴 글을 통째로 훑지 않게.
const MAX_SCANNED_TEXT_LENGTH = 10_000;

const WEB_URL_START_PATTERN = /https?:\/\//i;
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

// 흔한 스킴 오타는 http(s) 로 고친다.
const WEB_SCHEME_TYPOS = new Map([
  ["ttps", "https"],
  ["htps", "https"],
  ["htttps", "https"],
  ["hhttps", "https"],
  ["ttp", "http"],
  ["htp", "http"],
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
  // Expo 가 번들 ID 로 자동 등록하는 우리 앱 스킴
  "com.mashup.promise9",
  // 보안 보고서가 위험한 주소를 일부러 무력화한 표기 — 되살려 열지 않는다.
  "hxxp",
  "hxxps",
]);
// 이름이 계속 늘어나는 스킴 — 크롬 내부(chrome-extension·chrome-devtools…)·Windows 핸들러(ms-settings·ms-msdt…)·
// 구글 로그인 콜백(역방향 클라이언트 ID).
const BLOCKED_SCHEME_PREFIXES = [
  "chrome",
  "ms-",
  "com.googleusercontent.apps.",
];
// 카카오 로그인 콜백(kakao + 네이티브 앱 키)
const KAKAO_CALLBACK_SCHEME_PATTERN = /^kakao[0-9a-f]{32}$/;

// 보이지 않거나 글자 방향을 뒤집는 문자 — 화면에 보이는 주소와 실제로 여는 주소를 다르게 만들 수 있다.
// 제어 문자(C0·DEL·C1)·소프트 하이픈·서식/결합 문자·제로폭 문자·방향 제어·한글 채움 문자·이체 선택자·BOM·
// 속기/악보 서식 문자·태그 문자.
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
  [0xfe00, 0xfe0f],
  [0xfeff, 0xfeff],
  [0xffa0, 0xffa0],
  [0xfff9, 0xfffb],
  [0x1bca0, 0x1bca3],
  [0x1d173, 0x1d17a],
  [0xe0000, 0xe007f],
  [0xe0100, 0xe01ef],
];

// 서버(POST /links)와 같은 파서(WHATWG URL)로 본다 — 포트 범위·호스트 금지 문자 등.
const urlSchema = z.url();

function getScheme(value: string): string | null {
  return SCHEME_PATTERN.exec(value)?.[1]?.toLowerCase() ?? null;
}

function isBlockedScheme(scheme: string): boolean {
  return (
    BLOCKED_SCHEMES.has(scheme) ||
    BLOCKED_SCHEME_PREFIXES.some((prefix) => scheme.startsWith(prefix)) ||
    KAKAO_CALLBACK_SCHEME_PATTERN.test(scheme)
  );
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
    // 브라우저는 "//" 뒤의 "/"·"\" 를 건너뛰고 "\" 를 "/" 로 읽는다 — 보이는 것과 다른 호스트를 열 수 있다.
    return /^\/\/[^/\\]/.test(rest) && !value.includes("\\") ? value : null;
  }
  return rest.replace(/^\/\//, "") === "" ? null : value;
}

// "https://toss.tech@evil.com"·"googlechromes://toss.im@evil.com" 처럼 @ 앞을 도메인으로 착각하게 만드는 계정 정보.
// 스킴 안에 주소를 품은 링크("microsoft-edge:https://…")도 있어 처음 나오는 "//" 뒤를 본다.
function hasUserinfo(url: string): boolean {
  const start = url.indexOf("//");
  if (start === -1) return false;
  const rest = url.slice(start + 2).replace(/^[/\\]+/, "");
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
  if (hasUserinfo(url)) return { ok: false, reason: "userinfo" };
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

/**
 * 저장된 링크를 열어도 되는지. 규칙이 바뀌기 전에 저장된 링크(공백 포함 등)도 열려야 해서
 * 저장 규칙 대신 위험한 스킴과 제어·보이지 않는 문자만 막는다.
 */
export function isOpenableLinkUrl(url: string): boolean {
  const value = url.trim();
  const scheme = getScheme(value);
  if (scheme !== null && isBlockedScheme(scheme)) return false;
  return !hasInvisibleChar(value);
}

// 공유 텍스트에서 스킴 없는 주소를 링크로 볼 도메인 끝 — "Next.js/React"·"보고서.pdf/hwp" 같은 파일명·기술 용어를 거른다.
// 단축 주소(naver.me·kko.to·bit.ly·t.co·youtu.be·goo.gl·forms.gle 등)의 끝을 포함한다.
const TEXT_LINK_TLDS = new Set(
  `com net org info biz edu gov kr jp cn us uk de fr eu me io co ly
  gl gle gg to be tv so ai im fm in it am fi do la gd app dev page
  site xyz link blog shop store news live kakao naver`.split(/\s+/),
);

// 닫는 괄호 → 짝이 되는 여는 괄호
const CLOSING_TO_OPENING = new Map([
  [")", "("],
  ["]", "["],
  ["}", "{"],
  [">", "<"],
  ["”", "“"],
  ["’", "‘"],
  ["」", "「"],
  ["』", "『"],
  ["】", "【"],
  ["》", "《"],
  ["〉", "〈"],
]);
const OPENING_BRACKETS = new Set(CLOSING_TO_OPENING.values());
const LEADING_PUNCTUATION = new Set([...OPENING_BRACKETS, '"', "'"]);
const TRAILING_PUNCTUATION = new Set(['"', "'", ".", ",", "!", "?", ";", ":"]);

// 링크를 감싼 괄호·따옴표와 뒤따른 문장 부호를 걷어낸다. 짝이 맞는 괄호는 주소의 일부로 남기고
// ("…/Foo_(bar)"), 짝 없는 닫는 괄호에서 주소가 끝난다("누리집(https://www.korea.kr)에서").
function trimLinkPunctuation(token: string): string {
  let start = 0;
  while (LEADING_PUNCTUATION.has(token.charAt(start))) start += 1;
  const openBrackets: string[] = [];
  let end = start;
  for (; end < token.length; end += 1) {
    const char = token.charAt(end);
    const opening = CLOSING_TO_OPENING.get(char);
    if (opening === undefined) {
      if (OPENING_BRACKETS.has(char)) openBrackets.push(char);
    } else if (openBrackets.pop() !== opening) {
      break;
    }
  }
  while (end > start && TRAILING_PUNCTUATION.has(token.charAt(end - 1))) {
    end -= 1;
  }
  return token.slice(start, end);
}

function findWebLinkCandidate(token: string): string | null {
  const start = token.search(WEB_URL_START_PATTERN);
  return start === -1 ? null : trimLinkPunctuation(token.slice(start));
}

// 공유 텍스트는 문장이 섞여 오므로 입력 검증보다 좁게 본다 — "참고:이거"·"todo:장보기"·"사진.jpg" 를
// 링크로 착각하지 않게, 앱 전용 링크는 "://" 로 쓴 것만, 스킴 없는 주소는 www. 로 시작하거나
// 흔한 도메인 끝에 경로가 붙은 것만 본다.
function findOtherLinkCandidate(token: string): string | null {
  if (WEB_URL_START_PATTERN.test(token)) return null;
  const candidate = trimLinkPunctuation(token);
  const scheme = getScheme(candidate);
  if (scheme !== null && candidate.startsWith("//", scheme.length + 1)) {
    return candidate;
  }
  const matched = BARE_URL_PATTERN.exec(candidate);
  if (!matched) return null;
  if (/^www\./i.test(candidate)) return candidate;
  const tld = matched[2] ?? "";
  const hasPath = matched[3] !== undefined;
  return hasPath && TEXT_LINK_TLDS.has(tld.toLowerCase()) ? candidate : null;
}

/**
 * 공유 텍스트에서 첫 링크를 찾아 저장할 형태로 돌려준다. Android 는 "제목\nURL" 처럼 섞어 보내고,
 * 지도·SNS 앱은 스킴 없는 주소나 앱 전용 링크를 텍스트로 보낸다 — http(s) 를 먼저 찾는다.
 * 찾은 링크가 모두 규칙에 어긋나면 첫 링크의 거부 사유를, 링크가 없으면 not-found 를 돌려준다.
 */
export function findLinkInText(text: string): LinkUrlResult {
  const tokens = text.slice(0, MAX_SCANNED_TEXT_LENGTH).split(/\s+/);
  // 잘린 끝 토큰은 링크의 일부일 수 있어 버린다.
  if (text.length > MAX_SCANNED_TEXT_LENGTH) tokens.pop();
  const results = [
    ...tokens.map(findWebLinkCandidate),
    ...tokens.map(findOtherLinkCandidate),
  ]
    .filter((candidate) => candidate !== null)
    .map((candidate) => normalizeLinkUrl(candidate));
  return (
    results.find((result) => result.ok) ??
    results[0] ?? { ok: false, reason: "not-found" }
  );
}
