/**
 * @jest-environment node
 */
const fs = require("node:fs");
const path = require("node:path");

// iOS 공유 익스텐션은 별도 프로세스라 메모리 상한(실측 220MB 에서 jetsam)이 있다.
// Reanimated 를 import 하는 것만으로 워클릿 수백 개가 소스 컴파일돼 +77MB(Hermes V1 회귀)라,
// 익스텐션 번들(index.share.js)의 import 그래프에 아래 패키지가 들어오면 안 된다.
const FORBIDDEN_PACKAGES = [
  "react-native-reanimated",
  "react-native-worklets",
  "@gorhom/bottom-sheet",
  "react-native-keyboard-controller",
  "react-native-gesture-handler",
];

const ROOT = path.resolve(__dirname, "../../..");
// Metro iOS 번들과 같은 우선순위로 해석한다.
const EXTENSIONS = [
  ".ios.tsx",
  ".ios.ts",
  ".native.tsx",
  ".native.ts",
  ".tsx",
  ".ts",
  ".js",
];
const IMPORT_PATTERN =
  /(?:import|export)\s+(?!type\s)(?:[^'"]*?\sfrom\s*)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveLocal(specifier, fromFile) {
  let base;
  if (specifier.startsWith("@/")) {
    base = path.join(ROOT, "src", specifier.slice(2));
  } else if (specifier.startsWith("@shared/")) {
    base = path.join(ROOT, "shared", specifier.slice("@shared/".length));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }
  const candidates = [
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => path.join(base, `index${ext}`)),
  ];
  return candidates.find((file) => fs.existsSync(file)) ?? null;
}

// react-native-css 는 animation·transition 스타일을 만나면 런타임에 Reanimated 를 require 한다 —
// import 그래프에 안 드러나는 경로라 클래스 사용도 따로 막는다.
const CSS_ANIMATION_CLASS =
  /(?<![\w-])(animate-[a-z-]+|transition(?:-[a-z]+)?)(?![\w-])/;

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function walkExtensionGraph(entry) {
  const parentOf = new Map([[entry, null]]);
  const queue = [entry];
  const forbiddenImports = [];

  const chainOf = (file) => {
    const chain = [];
    for (let f = file; f; f = parentOf.get(f) ?? null) {
      chain.push(path.relative(ROOT, f));
    }
    return chain.join(" <- ");
  };

  while (queue.length > 0) {
    const file = queue.shift();
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const specifier = match[1] ?? match[2];
      const forbidden = FORBIDDEN_PACKAGES.find(
        (pkg) => specifier === pkg || specifier.startsWith(`${pkg}/`),
      );
      if (forbidden) {
        forbiddenImports.push(`${forbidden}: ${chainOf(file)}`);
        continue;
      }
      const resolved = resolveLocal(specifier, file);
      if (resolved && !parentOf.has(resolved)) {
        parentOf.set(resolved, file);
        queue.push(resolved);
      }
    }
  }

  const cssAnimations = [...parentOf.keys()].flatMap((file) => {
    const match = stripComments(fs.readFileSync(file, "utf8")).match(
      CSS_ANIMATION_CLASS,
    );
    return match ? [`${match[1]}: ${chainOf(file)}`] : [];
  });

  return { forbiddenImports, cssAnimations };
}

const graph = walkExtensionGraph(path.join(ROOT, "index.share.js"));

test("iOS 공유 익스텐션 번들은 Reanimated 계열 패키지를 import 하지 않는다", () => {
  expect(graph.forbiddenImports).toEqual([]);
});

test("iOS 공유 익스텐션 번들은 CSS animation·transition 클래스를 쓰지 않는다", () => {
  expect(graph.cssAnimations).toEqual([]);
});
