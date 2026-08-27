import { fileURLToPath } from "node:url";

import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
// test 필드 타입이 붙는 vitest 쪽 defineConfig 를 쓴다(vitest 4 는 loadEnv 를 재export 하지 않는다).
import { defineConfig } from "vitest/config";

import manifest from "./manifest.config.ts";

const resolvePath = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url));

const root = resolvePath("./");

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
      react(),
      tailwindcss(),
      // crx 는 manifest 를 읽어 진입점을 구성한다 — jsdom 테스트에는 불필요하고
      // 빌드 산출물(dist)을 건드리므로 vitest 실행 중에는 제외한다.
      ...(process.env.VITEST ? [] : [crx({ manifest })]),
    ],
    resolve: {
      alias: {
        "@": resolvePath("./src"),
        "@shared": resolvePath("../shared"),
        // 앱과 같은 이미지·폰트를 쓴다(캐릭터·Pretendard) — 복사본을 만들지 않는다.
        "@assets": resolvePath("../assets"),
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
    },
  };
});
