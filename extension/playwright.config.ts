import { defineConfig } from "@playwright/test";

/**
 * 익스텐션 E2E — 빌드한 확장을 실제로 설치해 돌린다(루트의 웹 E2E 와 별개).
 * 브라우저는 e2e/fixtures.ts 가 확장을 실은 persistent context 로 직접 띄운다.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./e2e/global-setup.ts",
  // 목 API 포트가 하나로 고정돼 있어(빌드에 박힌다) 동시에 돌릴 수 없다.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
});
