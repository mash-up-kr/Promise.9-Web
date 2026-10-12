import type { PropsWithChildren } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// Tailwind `animate-spin`(1s linear infinite)과 같은 회전.
// 네이티브에선 CSS animation 이 Reanimated 를 끌어와 iOS 공유 익스텐션 메모리 상한을 넘기므로
// RN Animated 로 돌린다(shareExtension.bundle.test). 웹은 SpinView.web.tsx.
export function SpinView({ children }: PropsWithChildren) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      {children}
    </Animated.View>
  );
}
