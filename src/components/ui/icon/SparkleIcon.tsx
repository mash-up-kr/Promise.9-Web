import Svg, { Path } from "react-native-svg";

export interface SparkleIconProps {
  size?: number;
  color?: string;
}

export function SparkleIcon({
  size = 14,
  color = "#0093FF",
}: SparkleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1 6.99997C5.17831 6.99997 6.99998 5.24198 6.99998 1C6.99998 5.24198 8.80884 6.99997 13 6.99997C8.80884 6.99997 6.99998 8.80884 6.99998 13C6.99998 8.80884 5.17831 6.99997 1 6.99997Z"
        fill={color}
        stroke={color}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
