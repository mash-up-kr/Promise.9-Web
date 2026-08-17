import {
  resolvePopoverOffsetPosition,
  resolvePopoverTop,
} from "./popover.utils";

describe("resolvePopoverTop", () => {
  const base = {
    trigger: { top: 462, left: 20, height: 54 },
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
      resolvePopoverTop({
        ...base,
        trigger: { top: 700, left: 20, height: 54 },
      }),
    ).toBe(700 - 100 - 8);
  });

  test("위로도 넘치면 safe-area 상단에 붙인다", () => {
    expect(
      resolvePopoverTop({
        ...base,
        trigger: { top: 60, left: 20, height: 54 },
        windowHeight: 200,
        safeAreaBottom: 0,
      }),
    ).toBe(47);
  });
});

// 링크 카드처럼 누른 항목 위에 겹쳐 띄우는 메뉴 — 카드 좌상단에서 일정 거리에 뜬다.
describe("resolvePopoverOffsetPosition", () => {
  const base = {
    // 시안 기준 좌측 열 카드(20, 126) · 160×244.
    trigger: { top: 126, left: 20, height: 244 },
    offset: { left: 67, top: 29 },
    panelWidth: 170,
    panelHeight: 142,
    windowWidth: 375,
    windowHeight: 812,
    safeAreaTop: 47,
    safeAreaBottom: 34,
    margin: 8,
  };

  test("트리거 좌상단에서 오프셋만큼 떨어뜨린다", () => {
    expect(resolvePopoverOffsetPosition(base)).toEqual({
      left: 20 + 67,
      top: 126 + 29,
    });
  });

  test("우측 열이라 오른쪽으로 넘치면 화면 안으로 민다", () => {
    expect(
      resolvePopoverOffsetPosition({
        ...base,
        trigger: { top: 126, left: 195, height: 244 },
      }).left,
    ).toBe(375 - 8 - 170);
  });

  test("마지막 줄이라 아래로 넘치면 화면 안으로 민다", () => {
    expect(
      resolvePopoverOffsetPosition({
        ...base,
        trigger: { top: 700, left: 20, height: 244 },
      }).top,
    ).toBe(812 - 34 - 142);
  });

  test("위로 넘치면 safe-area 상단에 붙인다", () => {
    expect(
      resolvePopoverOffsetPosition({
        ...base,
        trigger: { top: 10, left: 20, height: 244 },
        offset: { left: 67, top: 0 },
      }).top,
    ).toBe(47);
  });

  // 패널 크기를 모르는 첫 프레임에도 그려야 한다(밀어넣기만 보류).
  test("패널 크기를 모르면 오프셋 위치를 그대로 쓴다", () => {
    expect(
      resolvePopoverOffsetPosition({
        ...base,
        trigger: { top: 700, left: 195, height: 244 },
        panelWidth: null,
        panelHeight: null,
      }),
    ).toEqual({ left: 195 + 67, top: 700 + 29 });
  });

  test("트리거를 아직 재지 못했으면 화면 좌상단 기준으로 둔다", () => {
    expect(resolvePopoverOffsetPosition({ ...base, trigger: null })).toEqual({
      left: 8 + 67,
      top: 47 + 29,
    });
  });
});
