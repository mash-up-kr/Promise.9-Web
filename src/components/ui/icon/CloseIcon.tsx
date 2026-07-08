import Svg, { Path } from "react-native-svg";

export interface CloseIconProps {
  size?: number;
  color?: string;
}

export function CloseIcon({ size = 10, color = "#ffffff" }: CloseIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Path
        d="M1.66667 8.33333L5.00001 5.00001M5.00001 5.00001L8.33333 1.66667M5.00001 5.00001L1.66667 1.66667M5.00001 5.00001L8.33333 8.33333"
        stroke={color}
        strokeOpacity={0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
