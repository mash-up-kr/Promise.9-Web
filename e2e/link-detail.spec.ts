import { expect, test } from "./fixtures";

/**
 * 링크 상세 화면 골든 패스 — 요약 펼침 → 메모 입력.
 *
 * 상세는 이제 서버 데이터(GET /links/{id})를 그리므로, 홈 E2E 와 동일하게
 * 응답을 라우트에서 고정한다 — CI 가 실서버의 데이터 유무·지연·계정 상태에
 * 좌우되지 않게 한다. (태그 섹션은 화면에서 제거돼 시나리오에서 뺐다.)
 */
const AI_SUMMARY =
  "토스뱅크 인턴이 비회원 가입 전환율을 개선하는 과정에서 실험 설계와 가설 검증의 중요성을 배운 경험을 소개하는 글이에요.\n\n전환 퍼널 데이터를 분석해 우선순위를 정하고, 과거 실험 결과를 바탕으로 가설을 수립한 뒤 A/B 테스트를 진행했어요. 특히 여러 요소를 한 번에 바꾸기보다 하나의 가설만 검증하는 방식으로 실험의 원인을 명확하게 파악하려고 했어요. 초기에는 문제 정의가 모호해 원하는 결과를 얻지 못했지만, 이후 사용자 행동 데이터를 기반으로 실제 문제를 발견하고 개선해 전환율 향상이라는 성과를 만들었어요.";

const linkDetailResponse = {
  success: true,
  data: {
    linkId: 1,
    url: "https://example.com/article",
    folder: { folderId: 1, folderName: "E2E 폴더", color: "#61a8ef" },
    thumbnailUrl: null,
    title: "E2E 상세 링크",
    source: "example.com",
    publishedAt: null,
    savedAt: "2026-08-01T00:00:00.000Z",
    isFavorite: false,
    viewedAt: null,
    processingStatus: "SUCCESS",
    aiSummary: AI_SUMMARY,
    tags: [],
    memo: null,
    relatedLinks: [],
  },
};

test.beforeEach(async ({ page }) => {
  // GET /links/{id} 상세 조회. 자동 저장 PATCH(같은 경로)도 이 응답으로 받아 넘긴다.
  await page.route(/\/links\/[^/?]+/, (route) =>
    route.fulfill({ json: linkDetailResponse }),
  );
});

test("링크 상세 화면에서 요약을 펼치고, 메모를 입력할 수 있다", async ({
  page,
}) => {
  await page.goto("/link/1");

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

  const memoInput = page.getByPlaceholder(
    "저장한 이유나 기억하고 싶은 점을 적어보세요",
  );
  const memoText = "E2E 테스트로 작성한 메모입니다.";
  await memoInput.fill(memoText);
  await expect(memoInput).toHaveValue(memoText);
  await expect(page.getByText(`${memoText.length}/300`)).toBeVisible();
});
