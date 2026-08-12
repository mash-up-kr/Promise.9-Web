// diffClamp: 스크롤 delta 를 누적하되 [0, max] 로 클램프한다.
// 위로 스크롤하면 페이지 위치와 무관하게 즉시 줄어들어 "역스크롤 시 헤더 재등장"이 된다.
export function accumulateHiddenOffset(
  current: number,
  delta: number,
  max: number,
): number {
  "worklet";
  return Math.min(Math.max(current + delta, 0), max);
}
