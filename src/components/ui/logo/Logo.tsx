import Svg, { Path, type SvgProps } from "react-native-svg";

import { LOGO_GLYPH_PATHS, LOGO_VIEW_BOX } from "./logo.constants";

export interface LogoProps extends SvgProps {}

// Figma Foundation/Logo. 기본 크기는 Size=Small(56×24) — Size=Large 는 width={70}
// height={30}. 글리프 기본색은 white-50 상당(흰색 + opacity 0.5) — svg fill 은
// className 토큰을 받지 못해 원본 export 값 그대로 둔다(FolderIcon 선례).
export function Logo({
  width = 56,
  height = 24,
  fill = "#ffffff",
  opacity = 0.5,
  ...props
}: LogoProps) {
  return (
    <Svg
      accessibilityRole="image"
      accessibilityLabel="링띵동"
      viewBox={LOGO_VIEW_BOX}
      width={width}
      height={height}
      {...props}
    >
      {LOGO_GLYPH_PATHS.map((d) => (
        <Path key={d} testID="logo-glyph" d={d} fill={fill} opacity={opacity} />
      ))}
    </Svg>
  );
}
