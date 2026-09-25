import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * OS 의 동작 줄이기(Reduce Motion) 설정. Reanimated 는 스스로 따르지만 RN Animated 는 그렇지 않아
 * 애니메이션을 직접 건너뛸 때 쓴다. 조회가 끝나기 전(첫 렌더)에는 false 다.
 */
export function useReduceMotion(): boolean {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setIsReduceMotionEnabled)
      .catch((error) => {
        console.warn("[a11y] 동작 줄이기 설정 조회 실패", error);
      });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsReduceMotionEnabled,
    );
    return () => subscription.remove();
  }, []);

  return isReduceMotionEnabled;
}
