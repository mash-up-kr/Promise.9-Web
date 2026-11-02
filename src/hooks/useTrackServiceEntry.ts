import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import { useEffect, useRef } from "react";
import {
  useAnalytics,
  useAnalyticsContext,
} from "@/components/analytics/AnalyticsContext";

/** 루트에서 최초 UTM을 반영한 뒤, 화면 조회 훅보다 먼저 호출한다. */
export function useTrackServiceEntry(): void {
  const { runtime } = useAnalyticsContext();
  const { trackEvent } = useAnalytics();
  const isEntryRecorded = useRef(false);
  useEffect(() => {
    if (!runtime || isEntryRecorded.current) return;
    const platform =
      require("@/lib/analytics/analytics.platform") as typeof import("@/lib/analytics/analytics.platform");
    isEntryRecorded.current = trackEvent({
      event_name: platform.isReloadNavigation()
        ? ANALYTICS_EVENTS.RELOAD
        : ANALYTICS_EVENTS.IN,
    });
  }, [runtime, trackEvent]);
}
