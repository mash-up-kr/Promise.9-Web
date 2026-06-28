import { GlassView } from "expo-glass-effect";

import type { GlassSurfaceProps } from "./types";

// iOS 구현 (확장자 없는 base 파일 = iOS + TS 타입 해석용).
// 네이티브 liquid glass: expo-glass-effect.
export function GlassSurface({
  children,
  className,
  style,
  cornerRadius = 9999,
  tint,
}: GlassSurfaceProps) {
  return (
    <GlassView
      isInteractive
      glassEffectStyle="clear"
      tintColor={tint}
      className={className}
      style={[{ borderRadius: cornerRadius }, style]}
    >
      {children}
    </GlassView>
  );
}
