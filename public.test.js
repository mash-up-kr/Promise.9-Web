/**
 * @jest-environment node
 */
// public/ 은 dist 로 통째로 복사되므로 테스트는 그 밖(루트)에 둔다.
const fs = require("node:fs");
const path = require("node:path");
const store = require("./store.config.base.json");

const SITE_URL = "https://link-ding-dong.com";
const PUBLIC_DIR = path.join(__dirname, "public");

// 로그인 없이 열리는 경로 — src/app/_layout.tsx 의 Stack.Protected 밖 라우트.
// 루트는 보호 라우트지만 서비스 진입 주소라 둔다(로그인 안 된 상태면 로그인으로 간다).
const PUBLIC_ROUTES = {
  "/": "src/app/(tabs)/index.tsx",
  "/login": "src/app/(auth)/login.tsx",
  "/settings/terms": "src/app/settings/terms.tsx",
  "/settings/privacy": "src/app/settings/privacy.tsx",
};
const PROTECTED_PATHS = [
  "/archive",
  "/link/",
  "/search",
  "/support",
  "/settings$",
  "/settings/withdraw",
  "/create-link",
  "/create-folder",
  "/edit-folder",
  "/move-links",
  "/auth/",
];

function readPublic(file) {
  return fs.readFileSync(path.join(PUBLIC_DIR, file), "utf8");
}

function metaContent(html, attr, key) {
  const tag = html.match(
    new RegExp(`<meta[^>]*${attr}="${key.replace(/[:]/g, "\\$&")}"[^>]*>`),
  );
  return tag?.[0].match(/content="([^"]*)"/)?.[1];
}

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe("index.html 메타", () => {
  const html = readPublic("index.html");
  const storeInfo = store.apple.info.ko;

  test("title·description 은 스토어 문구와 같다", () => {
    expect(html).toContain(`<title>${storeInfo.title}</title>`);
    expect(metaContent(html, "name", "description")).toBe(storeInfo.promoText);
  });

  // 미리보기 봇은 JS 를 실행하지 않아 정적 HTML 의 OG 만 읽는다.
  test("링크 미리보기용 OG·트위터 카드를 제공한다", () => {
    expect(metaContent(html, "property", "og:title")).toBe(storeInfo.title);
    expect(metaContent(html, "property", "og:description")).toBe(
      storeInfo.promoText,
    );
    expect(metaContent(html, "property", "og:url")).toBe(`${SITE_URL}/`);
    expect(metaContent(html, "property", "og:type")).toBe("website");
    expect(metaContent(html, "property", "og:locale")).toBe("ko_KR");
    expect(metaContent(html, "name", "twitter:card")).toBe(
      "summary_large_image",
    );
  });

  test("OG 이미지는 절대 URL 이고 public 의 1200×630 이미지를 가리킨다", () => {
    const image = metaContent(html, "property", "og:image");
    expect(image?.startsWith(`${SITE_URL}/`)).toBe(true);

    const file = path.join(PUBLIC_DIR, image.slice(SITE_URL.length));
    expect(fs.existsSync(file)).toBe(true);
    expect(pngSize(file)).toEqual({ width: 1200, height: 630 });
  });

  test("한국어 문서이고 앱 루트 요소를 유지한다", () => {
    expect(html).toMatch(/<html lang="ko">/);
    expect(html).toContain('<div id="root"></div>');
  });

  // iOS Safari 는 16px 미만 인풋에 포커스하면 화면을 확대한다(인풋 본문 14px).
  test("인풋 포커스 시 화면이 확대되지 않게 최대 배율을 1로 고정한다", () => {
    const viewport = metaContent(html, "name", "viewport")
      ?.split(",")
      .map((entry) => entry.trim());

    expect(viewport).toEqual(
      expect.arrayContaining([
        "width=device-width",
        "initial-scale=1",
        "maximum-scale=1",
      ]),
    );
  });
});

describe("검색 노출", () => {
  test("공개 경로는 실제 라우트 파일이 있다", () => {
    for (const file of Object.values(PUBLIC_ROUTES)) {
      expect(fs.existsSync(path.join(__dirname, file))).toBe(true);
    }
  });

  test("robots.txt 는 인증 경로를 막고 sitemap 을 알린다", () => {
    const robots = readPublic("robots.txt");
    const disallowed = robots
      .split("\n")
      .filter((line) => line.startsWith("Disallow:"))
      .map((line) => line.replace("Disallow:", "").trim());

    expect(disallowed).toEqual(expect.arrayContaining(PROTECTED_PATHS));
    for (const route of Object.keys(PUBLIC_ROUTES)) {
      expect(disallowed).not.toContain(route);
    }
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  test("sitemap 은 공개 경로만 담는다", () => {
    const locations = [
      ...readPublic("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map((match) => match[1]);

    expect(locations.sort()).toEqual(
      Object.keys(PUBLIC_ROUTES)
        .map((route) => `${SITE_URL}${route}`)
        .sort(),
    );
  });
});

// 웹 폰트는 scripts/sync-pretendard-web.js 가 생성한다 — 토큰에 family 가 추가됐는데 CSS 에 없으면
// 그 글자만 기본 폰트로 떨어지고, 조각 파일이 빠지면 해당 글자 범위만 폴백으로 남는다.
describe("웹 폰트 (public/fonts)", () => {
  const fontCss = readPublic("fonts/pretendard.css");

  test("토큰의 --font-pretendard* family 는 모두 @font-face 로 선언돼 있다", () => {
    const tokens = fs.readFileSync(
      path.join(__dirname, "shared/styles/tokens.css"),
      "utf8",
    );
    const requested = [
      ...tokens.matchAll(/--font-pretendard[\w-]*:\s*"([^"]+)"/g),
    ].map((match) => match[1]);
    const registered = new Set(
      [...fontCss.matchAll(/font-family:\s*"([^"]+)"/g)].map(
        (match) => match[1],
      ),
    );

    expect(requested.length).toBeGreaterThan(0);
    expect(requested.filter((family) => !registered.has(family))).toEqual([]);
  });

  test("CSS 가 참조하는 woff2 조각이 전부 존재한다", () => {
    const urls = [...fontCss.matchAll(/url\(([^)]+)\)/g)].map(
      (match) => match[1],
    );
    expect(urls.length).toBeGreaterThan(0);
    const missing = urls.filter(
      (url) => !fs.existsSync(path.join(PUBLIC_DIR, "fonts", url)),
    );
    expect(missing).toEqual([]);
  });

  test("index.html 이 폰트 CSS 를 링크한다", () => {
    expect(readPublic("index.html")).toContain(
      '<link rel="stylesheet" href="/fonts/pretendard.css" />',
    );
  });
});
