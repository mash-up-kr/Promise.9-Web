import { ExpoLiquidGlassNativeView } from "expo-liquid-glass-native";

import type { GlassSurfaceProps } from "./types";

// Android 구현: expo-liquid-glass-native (Kyant AndroidLiquidGlass 기반 AGSL).
export function GlassSurface({
  children,
  className,
  style,
  cornerRadius = 9999,
  tint = "#FFFFFF",
}: GlassSurfaceProps) {
  return (
    <ExpoLiquidGlassNativeView
      tint={tint}
      blurRadius={6}
      cornerRadius={cornerRadius}
      useRealtimeCapture
      className={className}
      style={[{ borderRadius: cornerRadius }, style]}
    >
      {children}
    </ExpoLiquidGlassNativeView>
  );
}
