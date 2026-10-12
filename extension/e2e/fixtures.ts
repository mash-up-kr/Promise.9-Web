import { fileURLToPath } from "node:url";

import {
  type BrowserContext,
  test as base,
  chromium,
  type Page,
} from "@playwright/test";

import { E2E_DIST_DIR, PANEL_PATH } from "./e2e.constants";
import { type MockApi, startMockApi } from "./mockApi";

export interface ActiveTab {
  id: number;
  url: string;
  title: string;
}

export const ARTICLE_TAB: ActiveTab = {
  id: 1,
  url: "https://toss.tech/article/50893",
  title: "누군가는 토스를 테스트하는 동안, 우리는 테스트하는 법을 만듭니다.",
};

interface ExtensionFixtures {
  mockApi: MockApi;
  context: BrowserContext;
  extensionId: string;
  /** 사이드패널 페이지를 탭으로 연다. `tab` 은 패널이 "지금 보고 있는 탭" 으로 받을 값. */
  openPanel: (tab?: ActiveTab) => Promise<Page>;
}

const VIEWPORT = { width: 420, height: 860 };
const EXTENSION_DIR = fileURLToPath(
  new URL(`../${E2E_DIST_DIR}`, import.meta.url),
);

/**
 * 빌드한 확장을 실제로 설치한 브라우저에서 돌린다 — 패널·background(service worker)·메시징·
 * chrome.storage 가 전부 실제이고, 서버만 목이다.
 */
export const test = base.extend<ExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright 는 픽스처 인자를 구조 분해로 읽는다.
  mockApi: async ({}, use) => {
    const api = await startMockApi();
    await use(api);
    await api.close();
  },

  // 목 API 가 먼저 떠 있어야 하므로 mockApi 에 의존한다.
  context: async ({ mockApi: _mockApi }, use, testInfo) => {
    const context = await chromium.launchPersistentContext("", {
      // 확장은 헤드리스 셸이 아니라 chromium 채널(new headless)에서만 로드된다.
      channel: "chromium",
      headless: !process.env.E2E_HEADED,
      slowMo: Number(process.env.E2E_SLOW_MO ?? 0),
      viewport: VIEWPORT,
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
      ],
    });

    // 직접 띄운 컨텍스트라 config 의 `use.trace` 가 안 붙는다 — 웹 E2E 와 같은 on-first-retry 로 맞춘다.
    const shouldTrace = testInfo.retry > 0;
    if (shouldTrace) {
      await context.tracing.start({ screenshots: true, snapshots: true });
    }
    await use(context);
    if (shouldTrace) {
      await context.tracing.stop({ path: testInfo.outputPath("trace.zip") });
    }
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    const [existing] = context.serviceWorkers();
    const worker = existing ?? (await context.waitForEvent("serviceworker"));
    await use(new URL(worker.url()).host);
  },

  openPanel: async ({ context, extensionId }, use) => {
    await use(async (tab = ARTICLE_TAB) => {
      const page = await context.newPage();
      // 실제 사이드패널에서 "활성 탭" 은 옆의 웹 페이지다. 패널을 탭으로 열면 패널 자신이 활성 탭이라
      // 저장할 수 없는 페이지로 뜬다 — 그 조회 하나만 고정하고 나머지 chrome API 는 그대로 둔다.
      await page.addInitScript((activeTab) => {
        const query = chrome.tabs.query.bind(chrome.tabs);
        chrome.tabs.query = (async (queryInfo: chrome.tabs.QueryInfo) =>
          queryInfo.active
            ? [activeTab]
            : query(queryInfo)) as typeof chrome.tabs.query;
      }, tab);
      await page.goto(`chrome-extension://${extensionId}/${PANEL_PATH}`);

      return page;
    });
  },
});

export { expect } from "@playwright/test";

/** 웹앱 로그인이 끝나면 background 가 토큰을 저장한다 — 패널은 저장소 변경으로만 그걸 안다. */
export async function signIn(page: Page): Promise<void> {
  await page.evaluate(() =>
    chrome.storage.local.set({ refreshToken: "e2e-refresh" }),
  );
}
