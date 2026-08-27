import { defineConfig, devices } from "@playwright/test";

/**
 * 웹(RN Web) E2E 설정 — 네이티브 앱 E2E(Maestro)와 분리.
 * 자세한 배경: docs/conventions/testing.md
 */
// pnpm web 과 같은 포트(8090)를 쓴다 — 서버 CORS 허용목록에 이미 http://localhost:8090
// 이 등록돼 있어(개발자들이 실 로그인 브라우저 테스트에 씀) 별도 등록 없이 E2E 에서도
// 마스터 토큰으로 실 API 를 호출할 수 있다. 충돌 시(로컬에서 pnpm web 을 이미 다른
// 용도로 띄워둔 경우 등) E2E_WEB_PORT 로 오버라이드.
const PORT = Number(process.env.E2E_WEB_PORT ?? 8090);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // webServer 가 뜬 뒤, 병렬 워커가 시작되기 전에 번들을 한 번 미리 데운다
  // (근거·상세: ./e2e/global-setup.ts 주석 참고).
  globalSetup: "./e2e/global-setup.ts",
  // 단언 실패 시 깔끔하게 종료
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI: PR 인라인 주석(github) + 실패 분석용 HTML 리포트(아티팩트로 업로드)
  reporter: process.env.CI ? [["github"], ["html"]] : "html",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Playwright 가 직접 expo 웹 서버를 띄우고, 준비될 때까지 기다린다.
  webServer: {
    command: `pnpm web --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // RN Web 첫 번들링은 느릴 수 있어 넉넉히.
    timeout: 180_000,
  },
});
