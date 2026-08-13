import { resolvePopoverTop } from "./popover.utils";

describe("resolvePopoverTop", () => {
  const base = {
    trigger: { top: 462, height: 54 },
    panelHeight: 100,
    windowHeight: 812,
    safeAreaTop: 47,
    safeAreaBottom: 34,
    gap: 8,
  };

  // 패널은 화면 전체를 덮는 Modal 안에 놓이므로 좌표는 화면 절대값이다.
  test("트리거를 아직 재지 못했으면 safe-area 바로 아래에 둔다", () => {
    expect(resolvePopoverTop({ ...base, trigger: null })).toBe(47 + 8);
  });

  test("공간이 넉넉하면 트리거 바로 아래에 둔다", () => {
    expect(resolvePopoverTop(base)).toBe(462 + 54 + 8);
  });

  // 패널 높이를 모르는 첫 프레임에도 아래 배치는 가능해야 한다(뒤집기만 보류).
  test("패널 높이를 몰라도 트리거 아래에 둔다", () => {
    expect(resolvePopoverTop({ ...base, panelHeight: null })).toBe(
      462 + 54 + 8,
    );
  });

  test("아래 공간이 부족하면 트리거 위로 뒤집는다", () => {
    expect(
      resolvePopoverTop({ ...base, trigger: { top: 700, height: 54 } }),
    ).toBe(700 - 100 - 8);
  });

  test("위로도 넘치면 safe-area 상단에 붙인다", () => {
    expect(
      resolvePopoverTop({
        ...base,
        trigger: { top: 60, height: 54 },
        windowHeight: 200,
        safeAreaBottom: 0,
      }),
    ).toBe(47);
  });
});
