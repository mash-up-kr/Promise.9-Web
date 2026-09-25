/**
 * @jest-environment node
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");

// iOS 공유 익스텐션은 별도 프로세스라 메모리 상한(실측 220MB 에서 jetsam)이 있다.
// Reanimated 를 import 하는 것만으로 워클릿 수백 개가 소스 컴파일돼 +77MB(Hermes V1 회귀)라,
// 익스텐션 번들(index.share.js)의 import 그래프에 아래 패키지가 들어오면 안 된다.
// 그래프는 우리 소스만 걷고 node_modules 안으로는 들어가지 않는다 — 그래서 모듈을 불러오는 순간
// Reanimated 를 require 하는 패키지도 이름으로 막는다(@expo/ui: State/index.fx).
const FORBIDDEN_PACKAGES = [
  "react-native-reanimated",
  "react-native-worklets",
  "@gorhom/bottom-sheet",
  "react-native-keyboard-controller",
  "react-native-gesture-handler",
  "@expo/ui",
];

const ROOT = path.resolve(__dirname, "../../..");
// Metro iOS 번들과 같은 순서로 해석한다 — 소스 확장자마다 .ios → .native → 플랫폼 없음.
const { sourceExts } = require(path.join(ROOT, "metro.config.js")).resolver;
const SOURCE_SUFFIXES = sourceExts.flatMap((ext) => [
  `.ios.${ext}`,
  `.native.${ext}`,
  `.${ext}`,
]);
const CODE_FILE = /\.[cm]?[jt]sx?$/;
// tsconfig paths 와 같다 — 더 구체적인 `@/assets/*` 가 `@/*` 보다 먼저다.
const ALIASES = [
  ["@/assets/", "assets/"],
  ["@/", "src/"],
  ["@shared/", "shared/"],
  ["@promise9/ui/", "packages/ui/"],
];

// react-native-css 는 animation·transition 스타일을 만나면 런타임에 Reanimated 를 require 한다 —
// import 그래프에 안 드러나는 경로라 클래스 사용도 따로 막는다.
const CSS_ANIMATION_CLASS =
  /(?<![\w-])((?:animate|duration|delay|ease)-(?:\[[^\]\s]*\]|[\w-]+)|transition(?:-(?:\[[^\]\s]*\]|[a-z]+))?)(?![\w-])/;

function findCssAnimationClass(text) {
  return text.match(CSS_ANIMATION_CLASS)?.[1] ?? null;
}

function isFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

// 확장자까지 적은 경로(이미지·CSS)는 그대로, 아니면 Metro 순서로 소스 파일·index 를 찾는다.
function resolveFile(base) {
  if (isFile(base)) return base;
  const candidates = [
    ...SOURCE_SUFFIXES.map((suffix) => base + suffix),
    ...SOURCE_SUFFIXES.map((suffix) => path.join(base, `index${suffix}`)),
  ];
  return candidates.find(isFile) ?? null;
}

function localBase(specifier, fromFile) {
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(fromFile), specifier);
  }
  const alias = ALIASES.find(([prefix]) => specifier.startsWith(prefix));
  if (!alias) return null;
  const [prefix, dir] = alias;
  return path.join(ROOT, dir, specifier.slice(prefix.length));
}

function packageName(specifier) {
  const [scope, name] = specifier.split("/");
  return scope.startsWith("@") ? `${scope}/${name}` : scope;
}

function isTypeOnlyImport(node) {
  const clause = node.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  const bindings = clause.namedBindings;
  return (
    !clause.name &&
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  );
}

function isModuleCall(node) {
  return (
    ts.isCallExpression(node) &&
    (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(node.expression) && node.expression.text === "require"))
  );
}

// 주석과 문자열을 구분하려고 정규식 대신 TypeScript 파서로 읽는다.
// 런타임 import(정적·동적·require)와, 클래스가 들어갈 수 있는 문자열 리터럴을 모은다.
function scanSource(fileName, text) {
  const source = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const specifiers = [];
  const strings = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      if (!isTypeOnlyImport(node)) specifiers.push(node.moduleSpecifier.text);
      return;
    }
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && !node.isTypeOnly) {
        specifiers.push(node.moduleSpecifier.text);
      }
      return;
    }
    if (isModuleCall(node)) {
      const [argument] = node.arguments;
      if (argument && ts.isStringLiteralLike(argument)) {
        specifiers.push(argument.text);
        return;
      }
    }
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      strings.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { specifiers, strings };
}

function walkExtensionGraph(entry) {
  const parentOf = new Map([[entry, null]]);
  const queue = [entry];
  const forbiddenImports = [];
  const unresolvedImports = [];
  const cssAnimations = [];

  const chainOf = (file) => {
    const chain = [];
    for (let f = file; f; f = parentOf.get(f) ?? null) {
      chain.push(path.relative(ROOT, f));
    }
    return chain.join(" <- ");
  };

  while (queue.length > 0) {
    const file = queue.shift();
    const { specifiers, strings } = scanSource(
      file,
      fs.readFileSync(file, "utf8"),
    );

    for (const text of strings) {
      const className = findCssAnimationClass(text);
      if (className) cssAnimations.push(`${className}: ${chainOf(file)}`);
    }

    for (const specifier of specifiers) {
      const forbidden = FORBIDDEN_PACKAGES.find(
        (pkg) => specifier === pkg || specifier.startsWith(`${pkg}/`),
      );
      if (forbidden) {
        forbiddenImports.push(`${forbidden}: ${chainOf(file)}`);
        continue;
      }
      const base = localBase(specifier, file);
      if (base === null) {
        // 모르는 별칭이 패키지처럼 보여 그래프에서 조용히 빠지지 않게 설치된 패키지인지 확인한다.
        const installed = path.join(
          ROOT,
          "node_modules",
          packageName(specifier),
        );
        if (!fs.existsSync(installed)) {
          unresolvedImports.push(`${specifier}: ${chainOf(file)}`);
        }
        continue;
      }
      const resolved = resolveFile(base);
      if (resolved === null) {
        unresolvedImports.push(`${specifier}: ${chainOf(file)}`);
        continue;
      }
      if (CODE_FILE.test(resolved) && !parentOf.has(resolved)) {
        parentOf.set(resolved, file);
        queue.push(resolved);
      }
    }
  }

  return { forbiddenImports, unresolvedImports, cssAnimations };
}

describe("iOS 공유 익스텐션 번들(index.share.js)", () => {
  const graph = walkExtensionGraph(path.join(ROOT, "index.share.js"));

  test("모든 import 를 파일이나 설치된 패키지로 해석한다", () => {
    expect(graph.unresolvedImports).toEqual([]);
  });

  test("Reanimated 계열 패키지를 import 하지 않는다", () => {
    expect(graph.forbiddenImports).toEqual([]);
  });

  test("CSS animation·transition 클래스를 쓰지 않는다", () => {
    expect(graph.cssAnimations).toEqual([]);
  });
});

describe("검사 도구", () => {
  test("Metro 처럼 확장자마다 .ios → .native → 기본 순으로 찾는다", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "share-bundle-"));
    try {
      fs.writeFileSync(path.join(dir, "Foo.ios.tsx"), "");
      fs.writeFileSync(path.join(dir, "Foo.ts"), "");
      fs.writeFileSync(path.join(dir, "Bar.tsx"), "");
      fs.writeFileSync(path.join(dir, "Bar.native.tsx"), "");
      expect(resolveFile(path.join(dir, "Foo"))).toBe(path.join(dir, "Foo.ts"));
      expect(resolveFile(path.join(dir, "Bar"))).toBe(
        path.join(dir, "Bar.native.tsx"),
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("정적·동적 import 와 require 를 모으고 타입 import 는 건너뛴다", () => {
    const { specifiers } = scanSource(
      "x.tsx",
      [
        'import A from "static";',
        'import type { B } from "type-only";',
        'import { type C } from "inline-type-only";',
        'export * from "re-export";',
        'const lazy = import("dynamic");',
        'const legacy = require("required");',
      ].join("\n"),
    );
    expect(specifiers).toEqual(["static", "re-export", "dynamic", "required"]);
  });

  test.each([
    "animate-spin",
    "web:animate-pulse",
    "animate-[wiggle_1s_ease-in-out_infinite]",
    "transition",
    "transition-colors",
    "transition-[opacity,transform]",
    "duration-150",
    "duration-[250ms]",
    "delay-75",
    "ease-in-out",
    "ease-[cubic-bezier(0.4,0,0.2,1)]",
  ])("애니메이션 클래스 %s 를 잡는다", (className) => {
    expect(findCssAnimationClass(`flex-1 ${className} px-4`)).not.toBeNull();
  });

  test("애니메이션과 무관한 클래스는 통과시킨다", () => {
    expect(
      findCssAnimationClass("flex-1 rounded-t-3xl bg-gray-900 text-caption-1"),
    ).toBeNull();
  });

  test("문자열 속 // 는 주석이 아니고, 주석 속 클래스는 무시한다", () => {
    const { strings } = scanSource(
      "x.tsx",
      [
        'const url = "https://a.b//c"; const spin = "animate-spin";',
        '// const fade = "transition";',
        '/* const slow = "duration-500"; */',
      ].join("\n"),
    );
    expect(strings.map(findCssAnimationClass).filter(Boolean)).toEqual([
      "animate-spin",
    ]);
  });
});
