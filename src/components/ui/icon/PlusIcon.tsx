import Svg, { Path } from "react-native-svg";

export interface PlusIconProps {
  size?: number;
  color?: string;
}

export function PlusIcon({ size = 12, color = "#121212" }: PlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.4 6H6M6 6H9.6M6 6V2.4M6 6V9.6"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
