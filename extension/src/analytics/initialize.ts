import { ANALYTICS_EVENTS } from "@shared/analytics/analytics.events";
import {
  type AnalyticsRuntime,
  createAnalytics,
} from "@shared/analytics/analytics.runtime";
import { bindAnalyticsIdentity } from "@shared/analytics/identity/identity";
import { getRefreshToken } from "@shared/api";
import {
  fetchUserAttribution,
  saveMarketingTouch,
} from "@shared/entities/user/user.attribution.api";
import { subscribeRefreshToken } from "@/lib/auth/tokenStorage";
import { subscribeBrowserActive } from "./lifecycle";

/** 패널 문서당 한 번만 생성한다. 서비스 워커와 큐를 중복 생성하지 않는다. */
export function initializeExtensionAnalytics(): AnalyticsRuntime | null {
  if (import.meta.env.VITE_ANALYTICS_ENABLED !== "true") return null;
  const region = import.meta.env.VITE_ANALYTICS_REGION;
  const identityPoolId = import.meta.env.VITE_ANALYTICS_IDENTITY_POOL_ID;
  const streamName = import.meta.env.VITE_ANALYTICS_STREAM_NAME;
  if (!region || !identityPoolId || !streamName) {
    console.warn("[analytics] missing_config");
    return null;
  }
  try {
    const runtime = createAnalytics({
      source: "extension",
      environment:
        import.meta.env.VITE_ANALYTICS_ENVIRONMENT === "production"
          ? "production"
          : "development",
      aws: {
        region,
        identityPoolId,
        streamName,
        keepalive:
          typeof Request !== "undefined" && "keepalive" in Request.prototype,
      },
      newId: () => crypto.randomUUID(),
      storage: {
        get: async (key) => {
          const result = await chrome.storage.local.get(key);
          return typeof result[key] === "string" ? result[key] : null;
        },
        set: async (key, value) => {
          await chrome.storage.local.set({ [key]: value });
        },
      },
    });
    runtime.client.trackEvent({ event_name: ANALYTICS_EVENTS.IN });
    // 화면이 마운트되기 전에 활성 상태를 맞춰 숨겨진 패널의 진입을 기록하지 않는다.
    runtime.client.setActive(document.visibilityState === "visible");
    // 화면은 즉시 표시하고 식별자 복구 뒤 계정 동기화만 이어서 진행한다.
    void runtime.ready
      .then(() => {
        bindAnalyticsIdentity(runtime, {
          getToken: getRefreshToken,
          subscribe: (notify) => {
            const stopTokens = subscribeRefreshToken(() => notify());
            const stopActive = subscribeBrowserActive(notify);
            return () => {
              stopTokens();
              stopActive();
            };
          },
          loadAttribution: fetchUserAttribution,
          saveTouch: saveMarketingTouch,
        });
      })
      .catch(() => console.warn("[analytics] startup_failed"));
    return runtime;
  } catch {
    console.warn("[analytics] startup_failed");
    return null;
  }
}
