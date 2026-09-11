import { getLinkGridLayout } from "./link-grid.utils";

// 시안(375 프레임) 기준: 좌우 패딩 20 → 콘텐츠 335, 카드 160 두 장, 가로 간격 15.
describe("getLinkGridLayout", () => {
  test("시안 폭(335)에서는 2열·카드 160 으로 시안과 같다", () => {
    expect(getLinkGridLayout(335)).toEqual({ columns: 2, tileWidth: 160 });
  });

  test("폭이 조금 넓어지면 열은 그대로 두고 카드가 남는 폭을 나눠 갖는다", () => {
    expect(getLinkGridLayout(353)).toEqual({ columns: 2, tileWidth: 169 });
  });

  test("카드 160 이 더 들어갈 만큼 넓으면 열을 늘린다", () => {
    // 웹 최대 폭 768 − 패딩 40
    expect(getLinkGridLayout(728)).toEqual({ columns: 4, tileWidth: 170.75 });
  });

  test("카드 두 장이 안 들어갈 만큼 좁아도 2열은 유지한다", () => {
    expect(getLinkGridLayout(300)).toEqual({ columns: 2, tileWidth: 142.5 });
  });

  // flex-wrap 그리드에서 부동소수점 오차로 한 줄 폭을 넘겨 마지막 카드가 다음 줄로 밀리지 않도록 내림한다.
  test("카드 폭은 소수 둘째 자리로 내려 한 줄 폭을 넘지 않게 한다", () => {
    const { columns, tileWidth } = getLinkGridLayout(550);
    expect({ columns, tileWidth }).toEqual({ columns: 3, tileWidth: 173.33 });
    expect(tileWidth * columns + 15 * (columns - 1)).toBeLessThanOrEqual(550);
  });
});
