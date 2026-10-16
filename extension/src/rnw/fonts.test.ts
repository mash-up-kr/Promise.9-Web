import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

// 토큰 family 와 생성 CSS 의 대조는 루트 public.test.js 가 한다. 여기선 익스텐션이 그 CSS 를
// 실제로 불러오는지만 본다 — import 가 빠지면 사이드패널 전체가 폴백 폰트로 뜬다.
describe("익스텐션 폰트", () => {
  it("사이드패널 진입점이 공용 웹 폰트 CSS 를 불러온다", () => {
    expect(read("../sidepanel/main.tsx")).toContain(
      'import "@public/fonts/pretendard.css";',
    );
  });
});
