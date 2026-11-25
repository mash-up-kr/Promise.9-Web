import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import type { AnalyticsClient } from "./analytics.client";

interface ScreenState {
  route: { name: string; path: string } | null;
  visit: { id: string; startedAt: number } | null;
}

/** 조회 구간과 페이지뷰 기록만 관리한다. 플랫폼 구독과 React 갱신은 호출부가 맡는다. */
export function createScreenTracking(
  client: AnalyticsClient,
  newId: () => string,
  onVisitChange: (visitId: string | null) => void,
): ScreenTracking {
  const current: ScreenState = { route: null, visit: null };
  const properties = () => ({
    screen_name: current.route?.name ?? null,
    screen_view_id: current.visit?.id ?? null,
  });
  const endScreenView = () => {
    if (!current.visit || !current.route) return;
    client.trackEvent({
      event_name: ANALYTICS_EVENTS.PAGE_VIEW,
      custom_data: {
        ...properties(),
        path: current.route.path,
        // 단조 시계로 재서 시스템 시각 보정에 영향을 받지 않는다.
        duration_ms: Math.max(
          0,
          Math.round(performance.now() - current.visit.startedAt),
        ),
      },
    });
    current.visit = null;
    onVisitChange(null);
  };
  const enterScreen = () => {
    if (client.isDisposed || !current.route || current.visit) return;
    try {
      current.visit = { id: newId(), startedAt: performance.now() };
    } catch {
      console.warn("[analytics] screen_visit_failed");
      return;
    }
    onVisitChange(current.visit.id);
  };
  return {
    get screenViewId() {
      return current.visit?.id ?? null;
    },
    screenProperties: properties,
    endScreenView,
    view(name: string, path: string) {
      if (client.isDisposed) return;
      if (current.route?.path !== path) {
        endScreenView();
        current.route = { name, path };
      }
      if (client.isActive) enterScreen();
    },
    handleActivityChange(isActive: boolean) {
      if (client.isDisposed) return;
      if (isActive !== client.isActive) {
        // 비활성 전환으로 큐를 보내기 전에 마지막 조회 구간을 기록한다.
        if (isActive) enterScreen();
        else endScreenView();
      }
      client.setActive(isActive);
    },
  };
}
export interface ScreenTracking {
  readonly screenViewId: string | null;
  screenProperties(): {
    screen_name: string | null;
    screen_view_id: string | null;
  };
  endScreenView(): void;
  view(name: string, path: string): void;
  handleActivityChange(isActive: boolean): void;
}
