import { trackComponentEvent } from "@shared/analytics/analytics.component";
import {
  IMPRESSION_DURATION_MS,
  IMPRESSION_RATIO,
} from "@shared/analytics/analytics.constants";
import type { TrackOptions } from "@shared/analytics/analytics.events";
import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import { useIsFocused } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, Dimensions, type View } from "react-native";
import {
  useAnalytics,
  useAnalyticsContext,
} from "@/components/analytics/AnalyticsContext";

/**
 * 전체 화면 기준으로 버튼의 노출을 측정하며, 부모 영역에 의해 잘린 부분은 반영하지 않는다.
 * 리스트 항목의 노출에는 리스트가 제공하는 가시 항목 정보를 사용한다.
 */
export function useTrackImpression(
  label: string,
  options: TrackOptions = {},
): React.RefObject<View | null> {
  const { disabled, custom_data } = options;
  const latestData = useRef(custom_data);
  latestData.current = custom_data;
  const isFocused = useIsFocused();
  const { trackEvent } = useAnalytics();
  const { screen, screenKey } = useAnalyticsContext();
  const ref = useRef<View | null>(null);
  const hasRecorded = useRef(false);
  useEffect(() => {
    if (hasRecorded.current || !screen || !screenKey || !isFocused || disabled)
      return;
    const view = screen.screenViewId;
    let visibleSince: number | null = null;
    let isStopped = false;
    const state = AppState.addEventListener("change", () => {
      visibleSince = null;
    });
    const timer = setInterval(() => {
      if (AppState.currentState !== "active" || screen.screenViewId !== view) {
        visibleSince = null;
        return;
      }
      ref.current?.measureInWindow((x, y, width, height) => {
        if (
          isStopped ||
          AppState.currentState !== "active" ||
          screen.screenViewId !== view
        ) {
          visibleSince = null;
          return;
        }
        const viewport = Dimensions.get("window");
        const area =
          Math.max(0, Math.min(x + width, viewport.width) - Math.max(x, 0)) *
          Math.max(0, Math.min(y + height, viewport.height) - Math.max(y, 0));
        if (
          width <= 0 ||
          height <= 0 ||
          area / (width * height) < IMPRESSION_RATIO
        ) {
          visibleSince = null;
          return;
        }
        visibleSince ??= Date.now();
        if (Date.now() - visibleSince < IMPRESSION_DURATION_MS) return;
        // 거절돼도 같은 화면에서 반복하지 않고 다음 포커스·화면 진입 때 다시 본다.
        hasRecorded.current = trackComponentEvent(
          trackEvent,
          screen,
          ANALYTICS_EVENTS.COMPONENT_IMPRESSION,
          label,
          latestData.current,
        );
        stop();
      });
    }, 250);
    const stop = () => {
      if (isStopped) return;
      isStopped = true;
      clearInterval(timer);
      state.remove();
    };
    return stop;
  }, [screen, trackEvent, label, screenKey, isFocused, disabled]);
  return ref;
}
