import Svg, { Path, type SvgProps } from "react-native-svg";

import {
  LOGO_SYMBOL_GLYPH_PATHS,
  LOGO_SYMBOL_VIEW_BOX,
} from "./logo.constants";

export interface LogoSymbolProps extends SvgProps {}

// Figma "Header / Home" 좌측 심볼 마크. 기본 크기는 원본 글리프(36×28.6711).
// 글리프색은 반투명 흰색(white-50) — svg fill 은 className 토큰을 받지 못해 prop 으로 받는다(Logo 선례).
export function LogoSymbol({
  width = 36,
  height = 28.6711,
  fill = "#ffffff",
  opacity = 0.5,
  ...props
}: LogoSymbolProps) {
  return (
    <Svg
      accessibilityRole="image"
      accessibilityLabel="링띵동"
      viewBox={LOGO_SYMBOL_VIEW_BOX}
      width={width}
      height={height}
      {...props}
    >
      {LOGO_SYMBOL_GLYPH_PATHS.map((d) => (
        <Path
          key={d}
          testID="logo-symbol-glyph"
          d={d}
          fill={fill}
          opacity={opacity}
        />
      ))}
    </Svg>
  );
}
