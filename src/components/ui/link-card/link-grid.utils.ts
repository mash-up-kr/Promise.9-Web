/** 시안 Content Card 폭·썸네일 비율(160×200)과 그리드 간격(가로 15 · 세로 20). */
export const LINK_TILE_WIDTH = 160;
export const LINK_TILE_THUMBNAIL_RATIO = 200 / 160;
export const LINK_GRID_COLUMN_GAP = 15;
export const LINK_GRID_ROW_GAP = 20;

export interface LinkGridLayout {
  columns: number;
  tileWidth: number;
}

// CSS `repeat(auto-fill, minmax(160px, 1fr))` 과 같은 규칙 — 카드 160 이 들어가는 만큼 열을 만들고
// 남는 폭은 카드가 나눠 갖는다. 시안 폭(335)에서는 정확히 2열·160 이 된다.
export function getLinkGridLayout(contentWidth: number): LinkGridLayout {
  const columns = Math.max(
    2,
    Math.floor(
      (contentWidth + LINK_GRID_COLUMN_GAP) /
        (LINK_TILE_WIDTH + LINK_GRID_COLUMN_GAP),
    ),
  );
  // 소수 둘째 자리로 내림 — flex-wrap 그리드에서 부동소수점 오차로 한 줄 폭을 넘겨
  // 마지막 카드가 다음 줄로 밀리지 않게 한다.
  const tileWidth =
    Math.floor(
      ((contentWidth - LINK_GRID_COLUMN_GAP * (columns - 1)) / columns) * 100,
    ) / 100;
  return { columns, tileWidth };
}
