import { describe, expect, it } from "vitest";

import rootPackage from "../../../package.json";
import extensionPackage from "../../package.json";

// 앱과 익스텐션이 같은 컴포넌트 소스를 컴파일한다 — 렌더링 스택 버전이 갈리면
// 한쪽에서만 깨진다. 루트와 문자 그대로 같은 지정자를 쓰게 강제한다.
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
  "es-toolkit",
] as const;

describe("앱과 공유하는 렌더링 의존성", () => {
  it.each(SHARED)("%s 버전 지정자가 루트와 같다", (name) => {
    const rootDeps: Record<string, string> = rootPackage.dependencies;
    const extensionDeps: Record<string, string> = extensionPackage.dependencies;

    expect(extensionDeps[name]).toBe(rootDeps[name]);
  });
});
