import { StyleSheet } from "react-native";

import ReactbitsGlassSurface from "./reactbits-glass-surface.web";
import type { GlassSurfaceProps } from "./types";

// Web 구현: reactbits Glass Surface (CSS backdrop-filter + SVG displacement).
// 실제 뒤 DOM 콘텐츠를 라이브로 굴절(스크롤 추종). Chromium 풀효과 / Safari·FF frosted 폴백.
export function GlassSurface({
  children,
  className,
  style,
  cornerRadius = 9999,
}: GlassSurfaceProps) {
  // RN ViewStyle → DOM CSSProperties (RN-Web 경계, 위치/사이즈 전달용).
  const cssStyle = StyleSheet.flatten(style) as unknown as React.CSSProperties;

  return (
    <ReactbitsGlassSurface
      width="100%"
      height="100%"
      borderRadius={cornerRadius}
      className={className}
      style={cssStyle}
    >
      {children}
    </ReactbitsGlassSurface>
  );
}
