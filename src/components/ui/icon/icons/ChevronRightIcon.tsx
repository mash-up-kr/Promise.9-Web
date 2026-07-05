import Svg, { Path } from "react-native-svg";

import type { SvgIconProps } from "./types";

export function ChevronRightIcon({ size = 16, ...props }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
