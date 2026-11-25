import { bindAnalyticsIdentity } from "@shared/analytics/identity/identity";
import { getRefreshToken } from "@shared/api";
import {
  fetchUserAttribution,
  saveMarketingTouch,
} from "@shared/entities/user/user.attribution.api";
import { useGlobalSearchParams, usePathname, useSegments } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useScreenTracking } from "@/hooks/useScreenTracking";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTrackServiceEntry } from "@/hooks/useTrackServiceEntry";
import { initializeAnalytics } from "@/lib/analytics/analytics.initialize";
import { AnalyticsContext, useAnalyticsContext } from "./AnalyticsContext";

interface AnalyticsProviderProps {
  children: ReactNode;
}

/** 앱·웹 런타임 루트. 초기화·전송을 기다리지 않고 children을 표시한다. */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [analytics] = useState(initializeAnalytics);
  const runtime = analytics?.runtime ?? null;
  const screen = useScreenTracking(
    runtime?.client ?? null,
    analytics?.platform.newAnalyticsId ?? null,
  );
  const screenKey = screen?.screenViewId ?? "";
  const lifecycleVersion = useRef(0);
  useEffect(() => {
    if (!analytics || !screen) return;
    const { runtime, platform } = analytics;
    const currentLifecycleVersion = ++lifecycleVersion.current;
    let isStopped = false;
    let stopIdentity: (() => void) | undefined;
    let stopPlatform: (() => void) | undefined;
    let stopCollecting: (() => void) | undefined;
    try {
      // 저장소 복구 중에도 앱·탭의 비활성 전환 시점을 놓치지 않는다.
      stopPlatform = platform.bindPlatformAnalytics(
        runtime.capture,
        screen.handleActivityChange,
      );
      // 다른 탭이 이미 저장한 값이라 다시 쓰지 않는다(다시 쓰면 탭끼리 이전 값으로 되돌릴 수 있다).
      stopCollecting = platform.subscribeCollectingChanges((isCollecting) =>
        runtime.setCollecting(isCollecting, { persist: false }),
      );
      void runtime.ready
        .then(() => {
          if (isStopped) return;
          // 준비 전에 비활성화되어 보내지 못한 이벤트는 ID 복구 직후 전송한다.
          if (!runtime.client.isActive) void runtime.client.flush();
          stopIdentity = bindAnalyticsIdentity(runtime, {
            getToken: getRefreshToken,
            subscribe: platform.subscribeIdentityChanges,
            loadAttribution: fetchUserAttribution,
            saveTouch: saveMarketingTouch,
          });
        })
        .catch(() => console.warn("[analytics] startup_failed"));
    } catch {
      console.warn("[analytics] startup_failed");
    }
    return () => {
      isStopped = true;
      stopIdentity?.();
      stopPlatform?.();
      stopCollecting?.();
      // StrictMode의 effect 재연결은 살아 있는 동일 수집기를 폐기하지 않는다.
      queueMicrotask(() => {
        if (lifecycleVersion.current !== currentLifecycleVersion) return;
        screen.endScreenView();
        void runtime.client.flush().finally(() => runtime.client.dispose());
      });
    };
  }, [analytics, screen]);
  return (
    <AnalyticsContext value={{ runtime, screen, screenKey }}>
      <AnalyticsNavigation />
      {children}
    </AnalyticsContext>
  );
}
function AnalyticsNavigation() {
  const { runtime } = useAnalyticsContext();
  const segments = useSegments();
  const pathname = usePathname();
  const {
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
  } = useGlobalSearchParams();
  const route = segments
    .filter((segment) => !segment.startsWith("("))
    .join("/");
  const screenName =
    route === "" || route === "index"
      ? "home"
      : route
          .replace(/\/\[id\]$/, "_detail")
          .replaceAll("/", "_")
          .replaceAll("-", "_");
  useEffect(() => {
    runtime?.capture({
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm,
    });
  }, [runtime, utmSource, utmMedium, utmCampaign, utmContent, utmTerm]);
  useTrackServiceEntry();
  // 실제 경로 대신 템플릿(/link/[id])을 남긴다 — 링크 ID로 회원을 특정할 수 있다. 구간은 실제 경로로 나눈다.
  useTrackScreen(screenName, `/${route === "index" ? "" : route}`, pathname);
  return null;
}
