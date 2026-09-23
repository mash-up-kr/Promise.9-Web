import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// 앱과 익스텐션이 같은 컴포넌트 소스를 컴파일한다 — 렌더링 스택이나 className 을 CSS 로 바꾸는
// Tailwind 의 버전이 갈리면 한쪽에서만 깨진다. 지정자가 아니라 실제 설치된 버전을 비교한다
// (`^4` 와 `^4.3.3` 처럼 지정자가 달라도, 같아도 설치 결과는 어긋날 수 있다).
const SHARED = [
  "react",
  "react-dom",
  "react-native-web",
  "react-native-css",
  "nativewind",
  "react-native-svg",
  "lucide-react-native",
  "tailwind-variants",
  "tailwind-merge",
  "tailwindcss",
  "@tanstack/react-query",
  "es-toolkit",
] as const;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION = path.resolve(HERE, "../..");
const ROOT = path.resolve(EXTENSION, "..");

function installedVersion(projectDir: string, name: string): string {
  const manifest = path.join(projectDir, "node_modules", name, "package.json");
  return JSON.parse(readFileSync(manifest, "utf8")).version;
}

describe("앱과 공유하는 렌더링 의존성", () => {
  it.each(SHARED)("%s 의 설치된 버전이 루트와 같다", (name) => {
    expect(installedVersion(EXTENSION, name)).toBe(
      installedVersion(ROOT, name),
    );
  });
});
