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
  let syncedToken: string | null | undefined;
  let hasPendingSync = false;
  const failedRequests = new WeakSet<AbortController>();
  const syncAttribution = async () => {
    if (isStopped) return;
    // 알림이 온 시점의 확인. 토큰을 읽는 사이 그 확인이 실패로 끝났어도 다시 묻지 않기 위해 기억한다.
    const requestAtNotify = requestAbortController;
    const token = await source.getToken();
    if (isStopped) return;
    if (!token) {
      requestAbortController?.abort();
      requestAbortController = undefined;
      hasPendingSync = false;
      syncedToken = null;
      runtime.identify(null);
      return;
    }
    // 확인 중 재발급(401 재시도 포함)마다 다시 시작하면 끝없이 반복될 수 있어 끝난 뒤 한 번만 다시 본다.
    if (requestAbortController) {
      hasPendingSync = true;
      return;
    }
    if (requestAtNotify && failedRequests.has(requestAtNotify)) return;
    // 같은 로그인의 앱 복귀·탭 전환에는 다시 묻지 않는다.
    if (token === syncedToken && !runtime.pendingTouch) return;
    const controller = new AbortController();
    requestAbortController = controller;
    try {
      const attribution = await source.loadAttribution(controller.signal);
      if (controller.signal.aborted) return;
      syncedToken = token;
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
        runtime.setUtm(touch);
      } else runtime.setUtm(accountTouch);
      if (!touch) return;
      const updated = await source.saveTouch(touch, controller.signal);
      if (controller.signal.aborted || updated.userId !== attribution.userId)
        return;
      // 응답을 기다리는 동안 새 접점이 들어왔으면 그 접점을 이전 응답으로 덮지 않는다.
      if (runtime.pendingTouch?.touch_id !== touch.touch_id) return;
      runtime.setUtm(updated.utm);
      runtime.acknowledgeTouch(touch.touch_id);
    } catch {
      failedRequests.add(controller);
      if (!controller.signal.aborted)
        console.warn("[analytics] identity_sync_failed");
      // 미동기화 접점은 저장소에 남겨 다음 로그인·새 접점·재실행 때 다시 시도한다.
    } finally {
      if (requestAbortController === controller) {
        requestAbortController = undefined;
        // 실패했으면 다음 알림까지 기다린다. 확인 중 들어온 재발급에 다시 묻지 않기 위해서다.
        if (hasPendingSync && !failedRequests.has(controller))
          void syncAttribution();
        hasPendingSync = false;
      }
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
