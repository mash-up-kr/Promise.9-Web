import { expect, test } from "@playwright/test";

/**
 * 링크 상세 화면 골든 패스 — 요약 펼침 → 태그 추가 → 메모 입력.
 * mock 데이터(`mockLinkDetail`, id="link-1") 기반, 백엔드 연동 없음.
 */
test("링크 상세 화면에서 요약을 펼치고, 태그를 추가하고, 메모를 입력할 수 있다", async ({
  page,
}) => {
  await page.goto("/link/link-1");

  const summaryToggle = page.getByRole("button", {
    name: "AI 요약으로 미리보기",
  });
  const summaryText = page.getByText(
    /토스뱅크 인턴이 비회원 가입 전환율을 개선하는 과정에서/,
  );

  // 접힘 상태: 요약 텍스트가 고정 높이로 잘려 보인다(AiSummarySection 의
  // COLLAPSED_HEIGHT=116px). RN Web 이 accessibilityState.expanded 를
  // aria-expanded 로 매핑하지 않아, role 대신 실제 렌더 높이로 펼침 여부를 검증한다.
  const collapsedHeight = (await summaryText.boundingBox())?.height ?? 0;
  expect(collapsedHeight).toBeLessThanOrEqual(120);

  await summaryToggle.click();

  const expandedHeight = (await summaryText.boundingBox())?.height ?? 0;
  expect(expandedHeight).toBeGreaterThan(collapsedHeight);

  await page.getByRole("button", { name: "태그 추가" }).click();
  await page.getByPlaceholder("태그를 입력해 주세요").fill("E2E테스트");
  await page.getByRole("button", { name: "추가" }).click();
  await expect(page.getByText("#E2E테스트")).toBeVisible();
  await page.getByRole("button", { name: "완료" }).click();

  const memoInput = page.getByPlaceholder(
    "저장한 이유나 기억하고 싶은 점을 적어보세요",
  );
  const memoText = "E2E 테스트로 작성한 메모입니다.";
  await memoInput.fill(memoText);
  await expect(memoInput).toHaveValue(memoText);
  await expect(page.getByText(`${memoText.length}/300`)).toBeVisible();
});
