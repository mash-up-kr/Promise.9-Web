import { accumulateHiddenOffset } from "./header.scroll";

describe("accumulateHiddenOffset (diffClamp)", () => {
  test("아래로 스크롤하면 delta 만큼 숨김량이 누적된다", () => {
    expect(accumulateHiddenOffset(0, 20, 107)).toBe(20);
    expect(accumulateHiddenOffset(20, 30, 107)).toBe(50);
  });

  test("숨김량은 헤더 높이(max)를 넘지 않는다", () => {
    expect(accumulateHiddenOffset(100, 50, 107)).toBe(107);
  });

  test("위로 스크롤하면 페이지 위치와 무관하게 즉시 줄어든다", () => {
    expect(accumulateHiddenOffset(107, -40, 107)).toBe(67);
  });

  test("숨김량은 0 미만으로 내려가지 않는다", () => {
    expect(accumulateHiddenOffset(10, -50, 107)).toBe(0);
  });
});
