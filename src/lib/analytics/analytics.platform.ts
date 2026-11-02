import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AnalyticsRuntime,
  AnalyticsStorage,
} from "@shared/analytics/analytics.runtime";
import type { ScreenTracking } from "@shared/analytics/analytics.screen";
import { subscribeTokens } from "@shared/api/token";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { AppState, Platform } from "react-native";
export const analyticsStorage: AnalyticsStorage = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
};
export function prepareAnalyticsPlatform(): void {
  // Expo 56이 WHATWG URL을 초기화하므로 난수 기능만 보완한다.
  if (!globalThis.crypto)
    Object.defineProperty(globalThis, "crypto", {
      value: {},
      configurable: true,
    });
  if (!globalThis.crypto.getRandomValues)
    Object.defineProperty(globalThis.crypto, "getRandomValues", {
      value: Crypto.getRandomValues,
      configurable: true,
    });
}
export const newAnalyticsId = (): string => Crypto.randomUUID();
export const isReloadNavigation = (): boolean => false;
export const isAnalyticsActive = (): boolean =>
  AppState.currentState === "active";
export function bindPlatformAnalytics(
  captureUtm: AnalyticsRuntime["capture"],
  handleActivityChange: ScreenTracking["handleActivityChange"],
): () => void {
  let isStopped = false;
  let hasReceivedLink = false;
  const capture = (url: string) => {
    if (!isStopped) captureUtm(Linking.parse(url).queryParams ?? {});
  };
  const linkSubscription = Linking.addEventListener("url", ({ url }) => {
    hasReceivedLink = true;
    capture(url);
  });
  handleActivityChange(isAnalyticsActive());
  const appStateSubscription = AppState.addEventListener(
    "change",
    (nextState) => {
      // iOS의 inactive 구간도 실제로 조작 중인 화면의 체류시간에서 제외한다.
      handleActivityChange(nextState === "active");
    },
  );
  // 초기 URL 조회가 늦어져도 구독 해제 함수는 즉시 반환한다.
  void Linking.getInitialURL()
    .then((url) => {
      if (url && !hasReceivedLink) capture(url);
    })
    .catch(() => console.warn("[analytics] initial_url_failed"));
  return () => {
    isStopped = true;
    linkSubscription.remove();
    appStateSubscription.remove();
  };
}

export function subscribeIdentityChanges(listener: () => void): () => void {
  const stopTokens = subscribeTokens(listener);
  const state = AppState.addEventListener("change", (next) => {
    if (next === "active") listener();
  });
  return () => {
    stopTokens();
    state.remove();
  };
}

export function getAnalyticsEnvironment() {
  return {
    os: Platform.OS,
    browser: null,
    clientVersion:
      Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null,
  };
}
