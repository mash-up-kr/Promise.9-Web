import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View, type ViewProps } from "react-native";

import { useReduceMotion } from "../hooks/useReduceMotion";

export interface SkeletonBlockProps extends ViewProps {
  className?: string;
}

// className 을 그대로 받도록 NativeWind 가 감싼 View 로 애니메이티드 컴포넌트를 만든다.
const AnimatedView = Animated.createAnimatedComponent(View);
// Tailwind `animate-pulse`: 2s 주기로 opacity 1 → 0.5 → 1, 두 구간마다 cubic-bezier(0.4, 0, 0.6, 1).
const PULSE_DURATION = 2000;
const PULSE_CURVE = Easing.bezier(0.4, 0, 0.6, 1);

// 네이티브 반복은 애니메이션 하나만 돌릴 수 있다(sequence 는 JS 가 구간마다 다시 건다) —
// 0→1 한 번의 진행에 두 구간의 곡선을 이어 붙인다.
function pulseEasing(progress: number) {
  return progress < 0.5
    ? PULSE_CURVE(progress * 2) / 2
    : 0.5 + PULSE_CURVE(progress * 2 - 1) / 2;
}

// 네이티브에선 CSS animation 이 Reanimated 를 끌어와 iOS 공유 익스텐션 메모리 상한을 넘기므로
// RN Animated 로 돌린다(shareExtension.bundle.test). 웹은 SkeletonBlock.web.tsx.
export function SkeletonBlock({ style, ...props }: SkeletonBlockProps) {
  const isReduceMotionEnabled = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 설정을 읽기 전(null)에도 멈춰 둔다 — 동작 줄이기 사용자에게 잠깐이라도 펄스가 보이지 않게.
    if (isReduceMotionEnabled !== false) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: PULSE_DURATION,
        easing: pulseEasing,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, isReduceMotionEnabled]);

  const opacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0.5, 1],
      }),
    [progress],
  );

  return <AnimatedView style={[style, { opacity }]} {...props} />;
}
