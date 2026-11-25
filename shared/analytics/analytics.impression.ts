import {
  IMPRESSION_DURATION_MS,
  IMPRESSION_RATIO,
} from "./analytics.constants";

interface ImpressionTracker {
  remainingMs(ratio: number, now: number): number | null;
  reset(): void;
}

/** 관찰·타이머·기록은 호출부가 담당하고, 연속 노출 조건만 판단한다. */
export function createImpressionTracker(): ImpressionTracker {
  let visibleSince: number | null = null;
  return {
    remainingMs(ratio, now) {
      if (ratio < IMPRESSION_RATIO) {
        visibleSince = null;
        return null;
      }
      visibleSince ??= now;
      return Math.max(0, IMPRESSION_DURATION_MS - (now - visibleSince));
    },
    reset() {
      visibleSince = null;
    },
  };
}
