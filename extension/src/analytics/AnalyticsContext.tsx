import type {
  AnalyticsInput,
  TrackOptions,
} from "@shared/analytics/analytics.events";
import type { AnalyticsRuntime } from "@shared/analytics/analytics.runtime";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { bindBrowserLifecycle } from "./lifecycle";
import { useDomTrack } from "./useDomTrack";
import { useScreenTracking } from "./useScreenTracking";

interface AnalyticsScreenContextValue {
  screen: ScreenTracking | null;
  screenKey: string;
}
interface ExtensionAnalyticsProviderProps {
  value: AnalyticsRuntime | null;
  children: ReactNode;
}
interface AnalyticsScreenProps {
  name: string;
  children: ReactNode;
}

const RuntimeContext = createContext<AnalyticsRuntime | null>(null);
const ScreenContext = createContext<AnalyticsScreenContextValue>({
  screen: null,
  screenKey: "",
});
const newId = () => crypto.randomUUID();
export const useAnalytics = () => useContext(RuntimeContext);
export const useAnalyticsScreen = () => useContext(ScreenContext);

export function ExtensionAnalyticsProvider({
  value,
  children,
}: ExtensionAnalyticsProviderProps) {
  const screen = useScreenTracking(value?.client ?? null, newId);
  const generation = useRef(0);
  useEffect(() => {
    if (!screen || !value) return;
    const revision = ++generation.current;
    const stop = bindBrowserLifecycle(screen.handleActivityChange);
    return () => {
      stop();
      // StrictMode가 같은 Provider를 재연결하면 현재 방문과 큐를 유지한다.
      queueMicrotask(() => {
        if (generation.current !== revision) return;
        screen.endScreenView();
        void value.client.flush().finally(() => value.client.dispose());
      });
    };
  }, [screen, value]);
  return (
    <RuntimeContext value={value}>
      <ScreenContext value={{ screen, screenKey: screen?.screenViewId ?? "" }}>
        {children}
      </ScreenContext>
    </RuntimeContext>
  );
}
export function AnalyticsScreen({ name, children }: AnalyticsScreenProps) {
  const { screen } = useAnalyticsScreen();
  useLayoutEffect(() => {
    // 패널 내부 화면은 URL 라우터가 없어 화면 이름으로 경로를 구분한다.
    screen?.view(name, `/${name}`);
  }, [screen, name]);
  return children;
}
export function useTrack(label: string, options: TrackOptions = {}) {
  const runtime = useAnalytics();
  const { screen, screenKey } = useAnalyticsScreen();
  const trackEvent = useCallback(
    (input: AnalyticsInput) => runtime?.client.trackEvent(input) ?? false,
    [runtime],
  );
  return useDomTrack(screen, trackEvent, label, screenKey, options);
}
