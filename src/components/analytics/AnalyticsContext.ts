import type { TrackEvent } from "@shared/analytics/analytics.events";
import type { AnalyticsRuntime } from "@shared/analytics/analytics.runtime";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { createContext, useContext, useMemo } from "react";

interface AnalyticsContextValue {
  runtime: AnalyticsRuntime | null;
  screen: ScreenTracking | null;
  screenKey: string;
}
export const AnalyticsContext = createContext<AnalyticsContextValue>({
  runtime: null,
  screen: null,
  screenKey: "",
});
/** Provider와 수집 훅에서만 사용하는 내부 문맥. */
export const useAnalyticsContext = () => useContext(AnalyticsContext);

export function useAnalytics(): { trackEvent: TrackEvent } {
  const client = useAnalyticsContext().runtime?.client ?? null;
  return useMemo(() => {
    const trackEvent: TrackEvent = (input, options) =>
      client?.trackEvent(input, options) ?? false;
    return {
      trackEvent,
    };
  }, [client]);
}
