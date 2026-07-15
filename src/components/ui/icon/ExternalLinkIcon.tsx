import Svg, { Path } from "react-native-svg";

export interface ExternalLinkIconProps {
  size?: number;
  color?: string;
}

export function ExternalLinkIcon({
  size = 16,
  color = "#E9E9EB",
}: ExternalLinkIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4.00003 12.6667L12.6667 3.99997M4.3467 3.99997H12.6667V12.32"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
