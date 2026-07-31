import { type BlurTint, BlurView } from "expo-blur";
import type { ViewProps } from "react-native";

import { tv } from "@/lib/tv";

const glassStyles = tv({ base: "overflow-hidden" });

export interface GlassViewProps extends ViewProps {
  /**
   * blur 강도(1–100). 색과 blur 반경을 함께 결정한다(expo-blur 모델).
   * 시안 픽셀 blur 기준: `intensity ≈ px × 5` (웹 blur = intensity×0.2 의 역).
   * 예: 시안 4px → 20, 15px → 75, 40px → 100(웹은 20px 상한).
   */
  intensity?: number;
  /** blur 색조 프리셋. 기본 dark. 표면색은 이 tint + intensity 로 결정된다. */
  tint?: BlurTint;
  className?: string;
}

/**
 * 유리(glass) 표면 — expo-blur BlurView 로 전 플랫폼 통일. 모양·하이라이트는 className 으로.
 *
 * - iOS: native material 로 실제 blur.
 * - 웹: backdrop-filter (blur 최대 20px, tint 프리셋 색 — 시안 rgba 와 근사).
 * - Android: blurMethod 기본 'none' → 반투명 근사. 실제 blur 는 콘텐츠를 BlurTargetView 로
 *   감싸야 해서(침습적) 후속 작업으로 미룬다.
 *
 * 표면색은 tint+intensity 가 결정하므로 className 에 배경색을 줘도 무시된다(웹은 expo 가
 * override, 네이티브는 NativeBlurView 가 가림).
 */
export function GlassView({
  intensity = 50,
  tint = "dark",
  className,
  children,
  ...props
}: GlassViewProps) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      className={glassStyles({ class: className })}
      {...props}
    >
      {children}
    </BlurView>
  );
}
