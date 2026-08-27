import { describe, expect, it } from "vitest";

import { createExtensionQueryClient } from "./queryClient";

describe("createExtensionQueryClient", () => {
  // 회귀 방지: retry 를 켜면 서스펜드된 폴더 조회가 실패했을 때 재시도가 보류되면서
  // 팝업이 스켈레톤인 채로 영원히 멈춘다(옵저버 0 → paused). 자세한 이유는 구현부 주석 참고.
  it("쿼리를 재시도하지 않는다", () => {
    const defaults = createExtensionQueryClient().getDefaultOptions();

    expect(defaults.queries?.retry).toBe(false);
  });

  it("오프라인 판단으로 요청을 보류하지 않는다", () => {
    const defaults = createExtensionQueryClient().getDefaultOptions();

    expect(defaults.queries?.networkMode).toBe("always");
    expect(defaults.mutations?.networkMode).toBe("always");
  });
});
