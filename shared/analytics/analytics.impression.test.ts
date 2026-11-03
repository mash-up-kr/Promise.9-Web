import { createImpressionTracker } from "./analytics.impression";

test("40% 이상 연속 1초 노출된 경우에만 인정한다", () => {
  const tracker = createImpressionTracker();
  expect(tracker.remainingMs(0.4, 0)).toBe(1000);
  expect(tracker.remainingMs(0.7, 999)).toBe(1);
  expect(tracker.remainingMs(0.4, 1000)).toBe(0);
});

test("비율이 기준 아래로 내려가면 연속 시간을 다시 센다", () => {
  const tracker = createImpressionTracker();
  tracker.remainingMs(0.5, 0);
  expect(tracker.remainingMs(0.39, 900)).toBeNull();
  expect(tracker.remainingMs(0.5, 1000)).toBe(1000);
  expect(tracker.remainingMs(0.5, 1999)).toBe(1);
  expect(tracker.remainingMs(0.5, 2000)).toBe(0);
});

test("숨김·구독 해제로 초기화하면 이전 노출 시간을 이어받지 않는다", () => {
  const tracker = createImpressionTracker();
  tracker.remainingMs(1, 0);
  tracker.reset();
  expect(tracker.remainingMs(1, 5000)).toBe(1000);
  expect(tracker.remainingMs(1, 6000)).toBe(0);
});

test("각 대상의 노출 시간을 독립적으로 관리한다", () => {
  const first = createImpressionTracker();
  const second = createImpressionTracker();
  first.remainingMs(1, 0);
  expect(second.remainingMs(1, 1000)).toBe(1000);
  expect(first.remainingMs(1, 1000)).toBe(0);
});
