import { chromium, type FullConfig } from "@playwright/test";

/**
 * Metro(webServer)의 첫 JS 번들 컴파일은 느릴 수 있는데, Playwright 의 webServer
 * 준비 확인(config 의 url 폴링)은 HTML 껍데기 응답만 보고 통과시킨다 — 실제 번들은
 * 브라우저가 스크립트 태그를 요청할 때 비로소 컴파일된다. 그 결과 병렬 워커가 동시에
 * 뜨면 그중 하나(주로 첫 실제 페이지 진입)가 이 콜드 컴파일 비용을 고스란히 떠안아
 * assertion 타임아웃을 넘기는 flaky 가 났다(#75 병합 후 홈이 정적 mock 대신
 * useSuspenseQuery 를 쓰면서 렌더까지 걸리는 시간이 늘어 처음 드러남).
 *
 * 워커가 시작되기 전에 한 번 미리 방문해 번들을 데워, 컴파일 비용을 실제 테스트의
 * 타이밍 예산 밖에서 치른다 — 타임아웃을 늘려 증상을 가리는 대신 원인을 없앤다.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle", timeout: 120_000 });
  await browser.close();
}
