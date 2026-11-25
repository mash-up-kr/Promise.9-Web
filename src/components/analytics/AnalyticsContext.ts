import type { TrackEvent } from "@shared/analytics/analytics.events";
import type { AnalyticsRuntime } from "@shared/analytics/analytics.runtime";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

/** 설정 화면의 수집 끄기 토글. 수집이 꺼진 빌드이거나 저장값을 읽기 전이면 null 이다. */
export function useAnalyticsCollection(): {
  isCollecting: boolean;
  setCollecting: (isCollecting: boolean) => void;
} | null {
  const { runtime } = useAnalyticsContext();
  const [isCollecting, setIsCollecting] = useState<boolean | null>(null);
  useEffect(() => {
    if (!runtime) return;
    let isMounted = true;
    void runtime.ready
      .then(() => {
        if (isMounted) setIsCollecting(runtime.client.isCollecting);
      })
      .catch(() => console.warn("[analytics] startup_failed"));
    return () => {
      isMounted = false;
    };
  }, [runtime]);
  if (!runtime || isCollecting === null) return null;
  return {
    isCollecting,
    setCollecting: (value) => {
      runtime.setCollecting(value);
      setIsCollecting(value);
    },
  };
}
