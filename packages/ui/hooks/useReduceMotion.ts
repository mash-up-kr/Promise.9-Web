import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * OS 의 동작 줄이기(Reduce Motion) 설정. Reanimated 는 스스로 따르지만 RN Animated 는 그렇지 않아
 * 애니메이션을 직접 건너뛸 때 쓴다. 비동기로 읽어 그 전에는 null(모름)이다.
 */
export function useReduceMotion(): boolean | null {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setIsReduceMotionEnabled)
      .catch((error) => {
        // 모름으로 남기면 설정을 기다리는 애니메이션이 영영 시작되지 않는다.
        console.warn("[a11y] 동작 줄이기 설정 조회 실패", error);
        setIsReduceMotionEnabled(false);
      });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsReduceMotionEnabled,
    );
    return () => subscription.remove();
  }, []);

  return isReduceMotionEnabled;
}
