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
});
