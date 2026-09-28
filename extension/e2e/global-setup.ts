import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { E2E_DIST_DIR, MOCK_API_BASE_URL } from "./e2e.constants";

/**
 * 실제 확장을 설치해 돌리려면 빌드 산출물이 필요하다. API 주소는 빌드에 박히므로
 * 목 API 를 가리키는 전용 빌드를 따로 만든다(배포용 `dist` 는 건드리지 않는다).
 */
export default function globalSetup(): void {
  execFileSync(
    "pnpm",
    ["exec", "vite", "build", "--outDir", E2E_DIST_DIR, "--emptyOutDir"],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stdio: "inherit",
      env: { ...process.env, VITE_API_BASE_URL: MOCK_API_BASE_URL },
    },
  );
}
