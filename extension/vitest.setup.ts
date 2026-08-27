import "@testing-library/jest-dom/vitest";

import { beforeEach, vi } from "vitest";

beforeEach(() => {
  // 팝업은 여러 흐름의 끝에서 window.close() 를 부른다. jsdom 에서 실제로 닫히면 document 가
  // 사라져 그 뒤 RTL cleanup 이 깨지고, 엉뚱한 테스트가 같이 실패한다.
  vi.spyOn(window, "close").mockImplementation(() => undefined);
});
