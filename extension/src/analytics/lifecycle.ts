import type { ScreenTracking } from "@shared/analytics/analytics.screen";

/** 브라우저의 활성 상태를 화면 수집 훅에 전달한다. */
export function bindBrowserLifecycle(
  handleActivityChange: ScreenTracking["handleActivityChange"],
): () => void {
  const syncVisibility = () => {
    const isVisible = document.visibilityState === "visible";
    handleActivityChange(isVisible);
  };
  const pageHide = () => {
    // visibilitychange 없이 종료되는 경우도 처리하되 같은 방문을 두 번 닫지 않는다.
    handleActivityChange(false);
  };
  syncVisibility();
  window.addEventListener("pagehide", pageHide);
  window.addEventListener("pageshow", syncVisibility);
  document.addEventListener("visibilitychange", syncVisibility);
  return () => {
    window.removeEventListener("pagehide", pageHide);
    window.removeEventListener("pageshow", syncVisibility);
    document.removeEventListener("visibilitychange", syncVisibility);
  };
}

export function subscribeBrowserActive(listener: () => void): () => void {
  const onVisibility = () => {
    if (document.visibilityState === "visible") listener();
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => document.removeEventListener("visibilitychange", onVisibility);
}
