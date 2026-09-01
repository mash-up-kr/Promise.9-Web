import "@testing-library/jest-dom/vitest";

import { beforeEach, vi } from "vitest";

// 개발자의 extension/.env.local(VITE_WEB_APP_BASE_URL 등)이 테스트 결과를 바꾸면 안 된다 —
// 테스트는 항상 기본값(배포 웹앱 주소) 기준으로 돈다.
vi.stubEnv("VITE_WEB_APP_BASE_URL", "");

beforeEach(() => {
  // 팝업은 여러 흐름의 끝에서 window.close() 를 부른다. jsdom 에서 실제로 닫히면 document 가
  // 사라져 그 뒤 RTL cleanup 이 깨지고, 엉뚱한 테스트가 같이 실패한다.
  vi.spyOn(window, "close").mockImplementation(() => undefined);
});
