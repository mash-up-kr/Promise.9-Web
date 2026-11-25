import { trackComponentEvent } from "@shared/analytics/analytics.component";
import type { TrackOptions } from "@shared/analytics/analytics.events";
import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import { useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAnalytics,
  useAnalyticsContext,
} from "@/components/analytics/AnalyticsContext";
import { observeImpression } from "@/lib/analytics/analytics.impression.web";

export function useTrackImpression(
  label: string,
  options: TrackOptions = {},
): (node: unknown) => void {
  const isFocused = useIsFocused();
  const { trackEvent } = useAnalytics();
  const { screen, screenKey } = useAnalyticsContext();
  const { disabled, custom_data } = options;
  const latestData = useRef(custom_data);
  latestData.current = custom_data;
  const hasRecorded = useRef(false);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const ref = useCallback(
    (node: unknown) =>
      setElement(
        typeof HTMLElement !== "undefined" && node instanceof HTMLElement
          ? node
          : null,
      ),
    [],
  );
  useEffect(() => {
    if (
      !screen ||
      !element ||
      !screenKey ||
      !isFocused ||
      disabled ||
      hasRecorded.current
    )
      return;
    const view = screen.screenViewId;
    return observeImpression(element, {
      impression: () => {
        if (hasRecorded.current) return true;
        hasRecorded.current =
          screen.screenViewId === view &&
          trackComponentEvent(
            trackEvent,
            screen,
            ANALYTICS_EVENTS.COMPONENT_IMPRESSION,
            label,
            latestData.current,
          );
        return hasRecorded.current;
      },
    });
  }, [screen, trackEvent, element, label, screenKey, disabled, isFocused]);
  return ref;
}
