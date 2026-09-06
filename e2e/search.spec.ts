import { expect, test } from "@playwright/test";

/**
 * 검색 화면 웹 런타임 스모크 — "검색 실행 → 결과" 와 "최근 검색어 영속" 경로를 검증한다.
 * 홈과 같은 이유로 API 응답을 라우트에서 고정한다(실서버 상태·지연 비의존).
 * 최근 검색어는 기기(웹은 localStorage)에만 있어 첫 진입엔 섹션이 없다 — 검색을 한 번
 * 제출해 직접 만든 뒤 단언한다(.maestro/search.yaml 과 같은 구성).
 */
const searchResultResponse = {
  success: true,
  data: {
    links: [
      {
        linkId: 1,
        title: "E2E 검색 결과 링크",
        source: "example.com",
        representativeTag: null,
        thumbnailUrl: null,
        savedAt: "2026-08-01T00:00:00.000Z",
        reminderAt: null,
      },
    ],
    pagination: { nextCursor: null, hasNext: false, limit: 9 },
  },
};

const emptyListResponse = {
  success: true,
  data: {
    links: [],
    pagination: { nextCursor: null, hasNext: false, limit: 9 },
  },
};

test.beforeEach(async ({ page }) => {
  await page.route(/\/links(\?|$)/, (route) => {
    const url = new URL(route.request().url());
    // 검색(q)만 결과를 주고, 최근 본 링크(viewedAt)는 빈 목록 → 섹션 숨김 경로도 함께 탄다.
    if (url.searchParams.get("q")) {
      return route.fulfill({ json: searchResultResponse });
    }
    return route.fulfill({ json: emptyListResponse });
  });
});

test("검색을 제출하면 최근 검색어에 저장되어 기본 화면에 렌더된다", async ({
  page,
}) => {
  await page.goto("/search");

  const input = page.getByPlaceholder("검색");
  await input.fill("디자인");
  await input.press("Enter");
  await expect(page.getByText("E2E 검색 결과 링크")).toBeVisible();

  // 입력을 지우면 기본 화면으로 돌아오고, 방금 제출한 검색어가 최근 검색어로 보인다.
  await input.fill("");

  await expect(page.getByText("최근 검색어")).toBeVisible();
  await expect(page.getByText("모두 지우기")).toBeVisible();
});

test("검색어를 제출하면 결과 그리드가 뜬다", async ({ page }) => {
  await page.goto("/search");

  const input = page.getByPlaceholder("검색");
  await input.fill("디자인");
  await input.press("Enter");

  await expect(page.getByText("E2E 검색 결과 링크")).toBeVisible();
});
