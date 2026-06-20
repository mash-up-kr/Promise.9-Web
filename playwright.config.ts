import { defineConfig, devices } from "@playwright/test";

/**
 * 웹(RN Web) E2E 설정 — 네이티브 앱 E2E(Maestro)와 분리.
 * 자세한 배경: docs/conventions/testing.md
 */
const PORT = 8081; // expo start --web 의 Metro 웹 서버 기본 포트
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // 단언 실패 시 깔끔하게 종료
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Playwright 가 직접 expo 웹 서버를 띄우고, 준비될 때까지 기다린다.
  webServer: {
    command: "pnpm web",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // RN Web 첫 번들링은 느릴 수 있어 넉넉히.
    timeout: 180_000,
  },
});
