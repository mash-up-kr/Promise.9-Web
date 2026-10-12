import type { Metrics } from "react-native-safe-area-context";

/**
 * 익스텐션 프로세스엔 키 윈도우가 없어 safe-area-context 의 초기 메트릭이 오지 않는다.
 * 그러면 SafeAreaProvider 가 네이티브 인셋을 받을 때까지 자식을 그리지 않아 첫 프레임이 비고,
 * 네이티브가 JS 대신 깔아 둔 dim 이 그 사이에 걷혀 화면이 잠깐 밝아진다 —
 * 창 크기·인셋 0 으로 먼저 그리고 실제 인셋이 오면 갱신되게 한다.
 */
export function resolveInitialMetrics(
  native: Metrics | null,
  window: { width: number; height: number },
): Metrics {
  if (native) return native;
  return {
    frame: { x: 0, y: 0, width: window.width, height: window.height },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };
}
