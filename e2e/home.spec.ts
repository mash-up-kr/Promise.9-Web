import { expect, test } from "@playwright/test";

/**
 * 웹(RN Web) E2E — 홈 화면이 실제 브라우저에서 렌더되는지 검증.
 * RN 의 <Text> 는 RN Web 에서 실제 DOM 텍스트로 렌더되므로 getByText 로 잡힌다.
 *
 * 홈은 서버 데이터를 그리므로 응답을 라우트에서 고정한다 — CI 가 실서버의
 * 데이터 유무·지연에 좌우되면 같은 코드가 계정 상태에 따라 다르게 판정된다.
 */
const linkListResponse = {
  success: true,
  data: {
    links: [
      {
        linkId: 1,
        title: "E2E 검증용 링크",
        source: "example.com",
        representativeTag: null,
        thumbnailUrl: null,
        savedAt: "2026-08-01T00:00:00.000Z",
      },
    ],
    pagination: { nextCursor: null, hasNext: false, limit: 9 },
  },
};

const folderListResponse = {
  success: true,
  data: {
    systemFolders: {
      all: { linkCount: 1 },
      uncategorized: { linkCount: 0 },
      favorite: { linkCount: 0 },
      recentlyDeleted: { linkCount: 0 },
    },
    folders: [
      {
        folderId: 1,
        folderName: "E2E 폴더",
        color: "#61a8ef",
        linkCount: 1,
        lastSavedAt: "2026-08-01T00:00:00.000Z",
      },
    ],
  },
};

test.beforeEach(async ({ page }) => {
  await page.route(/\/links(\?|$)/, (route) =>
    route.fulfill({ json: linkListResponse }),
  );
  await page.route(/\/folders(\?|$)/, (route) =>
    route.fulfill({ json: folderListResponse }),
  );
});

test("홈 화면이 최근 저장 섹션을 렌더한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("최근 저장")).toBeVisible();
  await expect(page.getByText("E2E 검증용 링크").first()).toBeVisible();
  await expect(page.getByText("자주 보는 폴더")).toBeVisible();
});
