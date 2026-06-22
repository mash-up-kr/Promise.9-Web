/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // 테스트가 아직 없는 초기 상태에서 `pnpm test` 가 실패하지 않도록.
  passWithNoTests: true,
  // E2E(Playwright, e2e/*.spec.ts)는 jest 가 아니라 playwright 가 실행한다.
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};
