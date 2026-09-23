import { useEffect, useRef } from "react";
import { Animated, Easing, View, type ViewProps } from "react-native";

export interface SkeletonBlockProps extends ViewProps {
  className?: string;
}

// className 을 그대로 받도록 NativeWind 가 감싼 View 로 애니메이티드 컴포넌트를 만든다.
const AnimatedView = Animated.createAnimatedComponent(View);
// Tailwind `animate-pulse` 곡선: 2s 주기로 opacity 1 → 0.5 → 1.
const PULSE_EASING = Easing.bezier(0.4, 0, 0.6, 1);

// 네이티브에선 CSS animation 이 Reanimated 를 끌어와 iOS 공유 익스텐션 메모리 상한을 넘기므로
// RN Animated 로 돌린다(shareExtension.bundle.test). 웹은 SkeletonBlock.web.tsx.
export function SkeletonBlock({ style, ...props }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = (toValue: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: 1000,
        easing: PULSE_EASING,
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([pulse(0.5), pulse(1)]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <AnimatedView style={[style, { opacity }]} {...props} />;
}
