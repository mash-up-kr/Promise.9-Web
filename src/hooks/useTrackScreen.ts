import { useEffect } from "react";
import { useAnalyticsContext } from "@/components/analytics/AnalyticsContext";

/** 화면 이동은 view가 이전 조회 구간을 기록하고, 루트 해제는 Provider가 처리한다. */
export function useTrackScreen(name: string, path: string): void {
  const { screen } = useAnalyticsContext();
  useEffect(() => {
    screen?.view(name, path);
  }, [screen, name, path]);
}
