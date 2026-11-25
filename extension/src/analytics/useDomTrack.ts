import { trackComponentEvent } from "@shared/analytics/analytics.component";
import type {
  TrackEvent,
  TrackOptions,
} from "@shared/analytics/analytics.events";
import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { observeTrackedElement } from "./tracking";

export function useDomTrack(
  screen: ScreenTracking | null,
  trackEvent: TrackEvent,
  label: string,
  screenKey: string,
  options: TrackOptions = {},
): { ref: (node: unknown) => void } {
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
    if (!screen || !element || !screenKey || !label.trim() || disabled) return;
    const view = screen.screenViewId;
    return observeTrackedElement(element, {
      isImpressionEnabled: !hasRecorded.current,
      click: () =>
        trackComponentEvent(
          trackEvent,
          screen,
          ANALYTICS_EVENTS.COMPONENT_CLICKED,
          label,
          latestData.current,
        ),
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
  }, [screen, trackEvent, element, label, screenKey, disabled]);
  return { ref };
}
