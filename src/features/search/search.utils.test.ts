import { SEARCH_POLICY } from "./search.constants";
import { addRecentKeyword } from "./search.utils";

describe("addRecentKeyword", () => {
  test("새 검색어를 맨 앞에 넣는다", () => {
    expect(addRecentKeyword(["b", "c"], "a")).toEqual(["a", "b", "c"]);
  });

  test("이미 있는 검색어는 맨 앞으로 이동한다(중복 없음)", () => {
    expect(addRecentKeyword(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  test("앞뒤 공백을 제거하고, 빈 검색어는 저장하지 않는다", () => {
    expect(addRecentKeyword(["a"], "  b  ")).toEqual(["b", "a"]);
    expect(addRecentKeyword(["a"], "   ")).toEqual(["a"]);
  });

  test(`최대 ${SEARCH_POLICY.recentKeywords.max} 개까지만 남긴다`, () => {
    const full = Array.from(
      { length: SEARCH_POLICY.recentKeywords.max },
      (_, i) => `k${i}`,
    );

    const next = addRecentKeyword(full, "new");

    expect(next).toHaveLength(SEARCH_POLICY.recentKeywords.max);
    expect(next[0]).toBe("new");
    expect(next).not.toContain(`k${SEARCH_POLICY.recentKeywords.max - 1}`);
  });
});
