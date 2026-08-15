import { useState } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PRESS_SCALE = 1.1;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 120;

/**
 * Figma Icon Button 공통 pressed 인터랙션 — 누르는 동안 배경 스왑용 isPressed 상태와
 * 전체 scale(1.1) 애니메이션 스타일(100ms ease-out 진입·120ms 복귀)을 제공한다.
 */
export function usePressedScale() {
  const [isPressed, setIsPressed] = useState(false);

  const scale = useSharedValue(1);
  const pressedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withTiming(PRESS_SCALE, {
      duration: PRESS_IN_MS,
      easing: Easing.out(Easing.ease),
    });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.value = withTiming(1, {
      duration: PRESS_OUT_MS,
      easing: Easing.out(Easing.ease),
    });
  };

  return { isPressed, pressedScaleStyle, handlePressIn, handlePressOut };
}
