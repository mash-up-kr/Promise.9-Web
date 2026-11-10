import { trackComponentEvent } from "@shared/analytics/analytics.component";
import type { TrackOptions } from "@shared/analytics/analytics.events";
import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import { useIsFocused } from "expo-router";
import { useCallback } from "react";
import {
  useAnalytics,
  useAnalyticsContext,
} from "@/components/analytics/AnalyticsContext";

/** 웹·앱 모두 컴포넌트의 onPress에서 수집한다. */
export function useTrackClick(
  label: string,
  options: TrackOptions = {},
): () => void {
  const { trackEvent } = useAnalytics();
  const { screen } = useAnalyticsContext();
  const isFocused = useIsFocused();
  const { disabled, custom_data } = options;
  return useCallback(() => {
    if (!disabled && isFocused)
      trackComponentEvent(
        trackEvent,
        screen,
        ANALYTICS_EVENTS.COMPONENT_CLICKED,
        label,
        custom_data,
      );
  }, [trackEvent, screen, label, disabled, isFocused, custom_data]);
}
