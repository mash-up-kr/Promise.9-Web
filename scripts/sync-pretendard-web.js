/**
 * Pretendard 가변 폰트 동적 서브셋(woff2)을 받아 웹 폰트 CSS 를 public/fonts 에 생성한다.
 * 앱 웹(index.html)과 크롬 익스텐션(main.tsx)이 같은 산출물을 쓴다.
 *
 *   node scripts/sync-pretendard-web.js   ← 버전을 올릴 때만 돌리고 산출물을 커밋한다
 */
const fs = require("node:fs");
const path = require("node:path");

const VERSION = "1.3.9";
const BASE_URL = `https://cdn.jsdelivr.net/npm/pretendard@${VERSION}/dist/web/variable/`;
const SOURCE_CSS = "pretendardvariable-dynamic-subset.css";
const OUT_DIR = path.join(__dirname, "..", "public", "fonts");
const CHUNK_DIR = "pretendard";
const DOWNLOAD_BATCH = 8;

// 앱 네이티브가 굵기별 static family 를 쓰므로(#25) 웹도 같은 이름을 선언한다. 가변 폰트는 family 의
// font-weight 로 굵기가 고정돼, font-weight 를 안 준 텍스트도 맞는 굵기로 그려진다.
const FAMILIES = [
  ["Pretendard", "45 920"],
  ["Pretendard-Medium", "500"],
  ["Pretendard-SemiBold", "600"],
  ["Pretendard-Bold", "700"],
];

const HEADER = `/*
 * 생성 파일 — 직접 고치지 말고 scripts/sync-pretendard-web.js 를 돌린다.
 * 출처: pretendard@${VERSION} dist/web/variable/${SOURCE_CSS} (SIL Open Font License 1.1, assets/fonts/OFL.txt)
 * 각 규칙은 unicode-range 조각 하나라, 브라우저는 페이지에 쓰인 글자 범위의 조각만 내려받는다.
 */
`;

function transform(officialCss) {
  const files = [];
  const rules = [];
  for (const block of officialCss.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const file = block.match(/url\([^)]*\/([^/)]+\.woff2)\)/)?.[1];
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (!file || !range) {
      throw new Error(`규칙을 해석하지 못했다:\n${block}`);
    }
    files.push(file);
    for (const [family, weight] of FAMILIES) {
      rules.push(`@font-face {
  font-family: "${family}";
  font-style: normal;
  font-display: swap;
  font-weight: ${weight};
  src: url(./${CHUNK_DIR}/${file}) format("woff2-variations");
  unicode-range: ${range};
}`);
    }
  }
  return { css: rules.join("\n"), files };
}

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} → ${response.status}`);
  }
  return response;
}

async function main() {
  const officialCss = await (await download(BASE_URL + SOURCE_CSS)).text();
  const { css, files } = transform(officialCss);

  const chunkDir = path.join(OUT_DIR, CHUNK_DIR);
  fs.rmSync(chunkDir, { recursive: true, force: true });
  fs.mkdirSync(chunkDir, { recursive: true });
  for (let i = 0; i < files.length; i += DOWNLOAD_BATCH) {
    await Promise.all(
      files.slice(i, i + DOWNLOAD_BATCH).map(async (file) => {
        const response = await download(
          `${BASE_URL}woff2-dynamic-subset/${file}`,
        );
        fs.writeFileSync(
          path.join(chunkDir, file),
          Buffer.from(await response.arrayBuffer()),
        );
      }),
    );
  }
  fs.writeFileSync(path.join(OUT_DIR, "pretendard.css"), `${HEADER}${css}\n`);
  console.log(
    `pretendard@${VERSION}: 조각 ${files.length}개, @font-face ${files.length * FAMILIES.length}개 → public/fonts`,
  );
}

module.exports = { transform };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
