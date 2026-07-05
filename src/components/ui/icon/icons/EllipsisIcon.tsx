import Svg, { Circle } from "react-native-svg";

import type { SvgIconProps } from "./types";

export function EllipsisIcon({ size = 24, ...props }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={5} cy={12} r={1.75} fill="currentColor" />
      <Circle cx={12} cy={12} r={1.75} fill="currentColor" />
      <Circle cx={19} cy={12} r={1.75} fill="currentColor" />
    </Svg>
  );
}
