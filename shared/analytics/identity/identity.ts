import type { AnalyticsRuntime } from "@shared/analytics/analytics.runtime";
import type {
  MarketingTouch,
  UserAttribution,
} from "@shared/entities/user/user.attribution.contracts";

interface IdentitySource {
  getToken: () => Promise<string | null>;
  loadAttribution: (signal: AbortSignal) => Promise<UserAttribution>;
  saveTouch: (
    touch: MarketingTouch,
    signal: AbortSignal,
  ) => Promise<UserAttribution>;
  subscribe: (listener: () => void) => () => void;
}

/** 로그인·UTM 변경 시 동기화하며, 변경 전에 보낸 요청의 응답은 적용하지 않는다. */
export function bindAnalyticsIdentity(
  runtime: AnalyticsRuntime,
  source: IdentitySource,
): () => void {
  let isStopped = false;
  let requestAbortController: AbortController | undefined;
  const syncAttribution = async () => {
    if (isStopped) return;
    requestAbortController?.abort();
    const controller = new AbortController();
    requestAbortController = controller;
    try {
      const token = await source.getToken();
      if (controller.signal.aborted) return;
      if (!token) {
        runtime.identify(null);
        return;
      }
      runtime.suspendIdentity();
      const attribution = await source.loadAttribution(controller.signal);
      if (controller.signal.aborted) return;
      runtime.identify(String(attribution.userId));
      // identify가 계정 전환 시 이전 계정의 미전송 접점을 비운 뒤 읽는다.
      const touch = runtime.pendingTouch;
      const accountTouch = attribution.utm;
      // 서버 응답 대기 중에도 방금 들어온 캠페인을 과거 접점으로 덮지 않는다.
      if (
        touch &&
        (!accountTouch ||
          Date.parse(touch.captured_at) > Date.parse(accountTouch.captured_at))
      ) {
        runtime.setUtm(touch, "local");
      } else runtime.setUtm(accountTouch, "account");
      if (!touch) return;
      const updated = await source.saveTouch(touch, controller.signal);
      if (controller.signal.aborted || updated.userId !== attribution.userId)
        return;
      runtime.setUtm(updated.utm, "account");
      runtime.acknowledgeTouch(touch.touch_id);
    } catch {
      if (!controller.signal.aborted)
        console.warn("[analytics] identity_sync_failed");
      // 미동기화 접점은 저장소에 남겨 다음 로그인·새 접점·재실행 때 다시 시도한다.
    }
  };
  const notify = () => {
    void syncAttribution();
  };
  const stopTokens = source.subscribe(notify);
  const stopTouch = runtime.subscribeTouch(notify);
  notify();
  return () => {
    isStopped = true;
    requestAbortController?.abort();
    stopTokens();
    stopTouch();
  };
}
