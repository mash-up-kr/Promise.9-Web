import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

// 앱은 굵기마다 family 이름이 다른 static 폰트를 expo-font 로 등록한다. 익스텐션은 CSS 로 직접
// 등록해야 하므로, 토큰에 family 가 추가됐는데 여기 @font-face 가 없으면 그 글자만 기본 폰트로 떨어진다.
describe("공유 Text 가 요청하는 폰트 family", () => {
  it("토큰의 --font-pretendard* family 는 모두 익스텐션 @font-face 로 등록돼 있다", () => {
    const tokens = read("../../../shared/styles/tokens.css");
    const globalCss = read("../styles/global.css");

    const requested = [
      ...tokens.matchAll(/--font-pretendard[\w-]*:\s*"([^"]+)"/g),
    ].map((match) => match[1]);
    const registered = new Set(
      [...globalCss.matchAll(/font-family:\s*"([^"]+)"/g)].map(
        (match) => match[1],
      ),
    );

    expect(requested.length).toBeGreaterThan(0);
    expect(requested.filter((family) => !registered.has(family))).toEqual([]);
  });
});
