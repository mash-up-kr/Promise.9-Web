import {
  ANALYTICS_COLLECTING_KEY,
  type AnalyticsRuntime,
  type AnalyticsStorage,
} from "@shared/analytics/analytics.runtime";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { subscribeTokens } from "@shared/api/token";
import {
  bindBrowserLifecycle,
  subscribeBrowserActive,
} from "./analytics.lifecycle.web";
export const analyticsStorage: AnalyticsStorage = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
};
export function prepareAnalyticsPlatform(): void {
  /* 브라우저는 Web Crypto를 제공한다. */
}
export const newAnalyticsId = (): string => crypto.randomUUID();
export const isAnalyticsActive = (): boolean =>
  document.visibilityState === "visible";
export function isReloadNavigation(): boolean {
  const navigation = globalThis.performance?.getEntriesByType?.(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;
  return navigation?.type === "reload";
}
export function bindPlatformAnalytics(
  captureUtm: AnalyticsRuntime["capture"],
  handleActivityChange: ScreenTracking["handleActivityChange"],
): () => void {
  captureUtm(Object.fromEntries(new URL(window.location.href).searchParams));
  return bindBrowserLifecycle(handleActivityChange);
}

export function subscribeIdentityChanges(listener: () => void): () => void {
  const stopTokens = subscribeTokens(listener);
  const stopActive = subscribeBrowserActive(listener);
  return () => {
    stopTokens();
    stopActive();
  };
}

/** 다른 탭에서 바꾼 수집 끄기 설정을 받는다. 저장소를 비운 신호(newValue null)는 다음 실행부터 반영한다. */
export function subscribeCollectingChanges(
  apply: (isCollecting: boolean) => void,
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_COLLECTING_KEY && event.newValue !== null)
      apply(event.newValue !== "false");
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function getAnalyticsEnvironment() {
  const ua = navigator.userAgent.toLowerCase();
  const os = /android/.test(ua)
    ? "android"
    : /iphone|ipad|ipod/.test(ua)
      ? "ios"
      : /macintosh/.test(ua)
        ? "macos"
        : /windows/.test(ua)
          ? "windows"
          : /linux/.test(ua)
            ? "linux"
            : "unknown";
  const browser = /edg\//.test(ua)
    ? "edge"
    : /firefox\//.test(ua)
      ? "firefox"
      : /chrome\//.test(ua)
        ? "chrome"
        : /safari\//.test(ua)
          ? "safari"
          : "unknown";
  return {
    os,
    browser,
    clientVersion: process.env.EXPO_PUBLIC_WEB_VERSION || null,
  };
}

export const supportsAnalyticsKeepalive = (): boolean =>
  typeof Request !== "undefined" && "keepalive" in Request.prototype;
