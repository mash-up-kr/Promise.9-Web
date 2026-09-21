import { fileURLToPath } from "node:url";

import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
// test 필드 타입이 붙는 vitest 쪽 defineConfig 를 쓴다(vitest 4 는 loadEnv 를 재export 하지 않는다).
import { defineConfig } from "vitest/config";

import manifest from "./manifest.config.ts";
import { reactNativeWeb } from "./vite.rnw.ts";

const resolvePath = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url));

const root = resolvePath("./");

// react-native-svg 등은 `.web.js` 플랫폼 파일로 웹 구현을 나눈다.
const WEB_FIRST_EXTENSIONS = [
  ".web.mjs",
  ".web.js",
  ".web.ts",
  ".web.tsx",
  ".mjs",
  ".js",
  ".mts",
  ".ts",
  ".jsx",
  ".tsx",
  ".json",
];

const REACT_NATIVE_SHIM = resolvePath("./src/rnw/react-native.ts");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "VITE_");

  // 없으면 shared/api/client.ts 가 모듈 로드 시점에 던지는데, 그 에러는 번들 안에서 터져
  // "팝업이 그냥 흰 화면" 으로만 보인다. 빌드 시점에 먼저 알려준다.
  if (!env.VITE_API_BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL 이 없습니다. extension/.env.local 을 만드세요 (extension/.env.example 참고).",
    );
  }

  return {
    plugins: [
      reactNativeWeb({ shim: REACT_NATIVE_SHIM }),
      react(),
      tailwindcss(),
      // crx 는 manifest 를 읽어 진입점을 구성한다 — jsdom 테스트에는 불필요하고
      // 빌드 산출물(dist)을 건드리므로 vitest 실행 중에는 제외한다.
      ...(process.env.VITEST ? [] : [crx({ manifest })]),
    ],
    resolve: {
      // `shared/` 는 extension/ 밖이라 기본 해석으로는 루트 node_modules 의 사본을 집는다.
      // 루트가 버전을 올리는 순간 사본이 둘이 되고, shared 의 쿼리 훅이 익스텐션의
      // QueryClientProvider 를 못 보게 된다("No QueryClient set"). 항상 익스텐션 것 하나만 쓴다.
      dedupe: [
        "react",
        "react-dom",
        "@tanstack/react-query",
        // packages/ui 도 extension/ 밖이다 — 같은 이유로 렌더링 스택을 익스텐션 것 하나로 고정한다.
        "react-native-web",
        "react-native-css",
        "nativewind",
        "react-native-svg",
        "lucide-react-native",
        "tailwind-variants",
        "tailwind-merge",
        "es-toolkit",
      ],
      extensions: WEB_FIRST_EXTENSIONS,
      alias: {
        "@": resolvePath("./src"),
        "@shared": resolvePath("../shared"),
        // 앱과 같은 이미지·폰트를 쓴다(캐릭터·Pretendard) — 복사본을 만들지 않는다.
        "@assets": resolvePath("../assets"),
      },
    },
    // dev 서버의 의존성 사전 번들은 Vite 플러그인을 타지 않는다 — 위 리졸버가 안 먹혀 라이브러리의
    // `react-native` 가 실제 RN(Flow 소스)으로 풀리고 "Flow is not supported" 로 죽는다.
    // `rolldownOptions.resolve.alias` 는 Vite 의 사전 번들 리졸버가 먼저 풀어버려 효과가 없다.
    optimizeDeps: {
      rolldownOptions: {
        plugins: [
          {
            name: "promise9:optimizer-react-native-web",
            resolveId(source: string) {
              if (source !== "react-native") return null;
              return resolvePath(
                "./node_modules/react-native-web/dist/index.js",
              );
            },
          },
        ],
        resolve: { extensions: WEB_FIRST_EXTENSIONS },
      },
    },
    define: {
      // shared/api 는 Expo 규약(EXPO_PUBLIC_*)으로 환경변수를 읽는다. 익스텐션은 Expo 가 아니라
      // Vite 라 그 이름의 값이 존재하지 않으므로, 빌드 타임에 VITE_* 값으로 치환해 넣는다.
      "process.env.EXPO_PUBLIC_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL,
      ),
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      // vitest 는 node_modules 를 Vite 를 거치지 않고 Node 로 로드한다 — 라이브러리의 `react-native`
      // 가 실제 RN 으로 풀려 "Unexpected token 'typeof'" 로 죽는다. Vite 파이프라인에 태운다.
      server: {
        deps: {
          inline: [/react-native/, "nativewind", "lucide-react-native"],
        },
      },
      // vitest 는 react-native-svg 진입점으로 CJS(`main`)를 고르고, CJS 의 require 는 Node 가 풀어
      // `.web.js` 를 건너뛴다. ESM 진입점을 직접 가리킨다.
      alias: [
        {
          find: /^react-native-svg$/,
          replacement: resolvePath(
            "./node_modules/react-native-svg/lib/module/index.js",
          ),
        },
      ],
    },
  };
});
