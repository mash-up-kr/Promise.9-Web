import { useEffect, useRef, useState } from "react";

import { SPLASH_FADE_OUT_MS, SPLASH_MIN_VISIBLE_MS } from "../splash.constants";

export type SplashPhase = "shown" | "fading" | "hidden";

/**
 * 스플래시 노출 단계 전이 — 앱 초기화(isAppInitialized)가 끝나고 최소 노출
 * 시간이 지나면 fading 으로, 페이드가 끝나면 hidden 으로 넘어간다.
 */
export function useSplashPhase(isAppInitialized: boolean): SplashPhase {
  const [phase, setPhase] = useState<SplashPhase>("shown");
  // 최소 노출 시간은 렌더가 아니라 "앱이 뜬 시각" 기준으로 계산한다.
  const shownAtRef = useRef(Date.now());

  useEffect(() => {
    if (phase === "shown") {
      if (!isAppInitialized) {
        return;
      }
      const elapsed = Date.now() - shownAtRef.current;
      const remaining = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
      const fadeTimer = setTimeout(() => setPhase("fading"), remaining);
      return () => clearTimeout(fadeTimer);
    }

    if (phase === "fading") {
      const hideTimer = setTimeout(
        () => setPhase("hidden"),
        SPLASH_FADE_OUT_MS,
      );
      return () => clearTimeout(hideTimer);
    }
  }, [phase, isAppInitialized]);

  return phase;
}
