import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { SPLASH_FADE_OUT_MS } from "../splash.constants";

const mascotSource = require("@/assets/images/splash-icon.png");

// Figma splash(106:12725) Image Wrapper 크기. 위치는 좌표 고정 없이 화면 중앙 정렬.
const MASCOT_SIZE = 180;

interface SplashOverlayProps {
  isFadingOut: boolean;
}

/**
 * 네이티브 스플래시와 동일한 화면을 JS 로 이어 그리는 오버레이 — 첫 레이아웃에
 * 네이티브 스플래시를 걷어내고(전환 무봉합), 웹까지 같은 스플래시를 보여준다.
 * 페이드 아웃(0.3초, ease-out)은 expo-splash-screen 이 iOS 밖에서 지원하지
 * 않아 여기서 직접 그린다.
 */
export function SplashOverlay({ isFadingOut }: SplashOverlayProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isFadingOut) {
      opacity.value = withTiming(0, {
        duration: SPLASH_FADE_OUT_MS,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isFadingOut, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID="splash-overlay"
      className="absolute inset-0 items-center justify-center bg-background-base"
      style={fadeStyle}
      pointerEvents={isFadingOut ? "none" : "auto"}
      onLayout={() => SplashScreen.hideAsync()}
    >
      <Image
        testID="splash-mascot"
        source={mascotSource}
        contentFit="contain"
        style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }}
      />
    </Animated.View>
  );
}
