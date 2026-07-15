import { REMIND_OPTIONS } from "./link.constants";

describe("link.constants", () => {
  test("리마인드 옵션은 3개이며 라벨을 가진다", () => {
    expect(REMIND_OPTIONS).toHaveLength(3);
    expect(REMIND_OPTIONS.map((o) => o.value)).toEqual([
      "soon",
      "later",
      "reference",
    ]);
    expect(REMIND_OPTIONS.every((o) => o.label.length > 0)).toBe(true);
  });
});
