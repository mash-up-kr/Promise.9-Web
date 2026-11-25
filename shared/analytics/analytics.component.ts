import type { ComponentCustomData, TrackEvent } from "./analytics.events";
import { ANALYTICS_EVENTS } from "./analytics.events";
import type { ScreenTracking } from "./analytics.screen";

/**
 * 클릭·노출 수집 훅에서 사용하는 기록 함수. component_clicked와 component_impression만 받는다.
 * label과 화면 정보를 custom_data에 합치며, 공통 필드와 직렬화는 trackEvent가 맡는다.
 */
export function trackComponentEvent(
  trackEvent: TrackEvent,
  screen: ScreenTracking | null,
  eventName: "component_clicked" | "component_impression",
  label: string,
  customData?: ComponentCustomData,
): boolean {
  if (
    eventName === ANALYTICS_EVENTS.COMPONENT_IMPRESSION &&
    !screen?.screenViewId
  )
    return false;
  try {
    return trackEvent({
      event_name: eventName,
      custom_data: {
        ...customData,
        screen_name: null,
        screen_view_id: null,
        ...screen?.screenProperties(),
        label: label.trim(),
      },
    });
  } catch {
    console.warn("[analytics] invalid_component_data");
    return false;
  }
}
