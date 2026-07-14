import { expect, test } from "@playwright/test";

/**
 * 웹(RN Web) E2E 예시 — 홈 화면이 실제 브라우저에서 렌더되는지 검증.
 * RN 의 <Text> 는 RN Web 에서 실제 DOM 텍스트로 렌더되므로 getByText 로 잡힌다.
 */
test("홈 화면이 최근 저장 섹션을 렌더한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("최근 저장")).toBeVisible();
});
