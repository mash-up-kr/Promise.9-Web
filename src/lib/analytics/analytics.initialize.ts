import type { AnalyticsRuntime } from "@shared/analytics/analytics.runtime";
import { Platform } from "react-native";

interface InitializedAnalytics {
  runtime: AnalyticsRuntime;
  platform: typeof import("./analytics.platform");
}

/** 환경 설정을 확인하고 앱·웹에서 사용할 런타임과 플랫폼 함수를 준비한다. */
export function initializeAnalytics(): InitializedAnalytics | null {
  if (process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== "true") return null;
  const identityPoolId = process.env.EXPO_PUBLIC_ANALYTICS_IDENTITY_POOL_ID;
  const streamName = process.env.EXPO_PUBLIC_ANALYTICS_STREAM_NAME;
  const region = process.env.EXPO_PUBLIC_ANALYTICS_REGION;
  if (!identityPoolId || !streamName || !region) {
    console.warn("[analytics] missing_config");
    return null;
  }
  try {
    // 수집이 꺼져 있으면 네이티브 저장소·난수 모듈도 불러오지 않는다.
    const platform =
      require("./analytics.platform") as typeof import("./analytics.platform");
    const { createAnalytics } =
      require("@shared/analytics/analytics.runtime") as typeof import("@shared/analytics/analytics.runtime");
    platform.prepareAnalyticsPlatform();
    const runtime = createAnalytics({
      source: Platform.OS === "web" ? "web" : "app",
      environment:
        process.env.EXPO_PUBLIC_ANALYTICS_ENVIRONMENT === "production"
          ? "production"
          : "development",
      aws: {
        identityPoolId,
        streamName,
        region,
        keepalive: platform.supportsAnalyticsKeepalive(),
      },
      storage: platform.analyticsStorage,
      newId: platform.newAnalyticsId,
      ...platform.getAnalyticsEnvironment(),
    });
    // 첫 화면 훅이 실행되기 전에 숨겨진 탭·비활성 앱 여부를 반영한다.
    runtime.client.setActive(platform.isAnalyticsActive());
    return { runtime, platform };
  } catch {
    console.warn("[analytics] startup_failed");
    return null;
  }
}
