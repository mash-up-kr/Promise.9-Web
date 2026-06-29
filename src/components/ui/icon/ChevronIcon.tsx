import Svg, { Path } from "react-native-svg";

export interface ChevronIconProps {
  /** true 면 180도 회전(아래 방향)해서 보여준다. 기본은 위 방향. */
  rotated?: boolean;
  size?: number;
  color?: string;
}

export function ChevronIcon({
  rotated = false,
  size = 16,
  color = "#8A8A93",
}: ChevronIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={rotated ? { transform: [{ rotate: "180deg" }] } : undefined}
    >
      <Path
        d="M12 10L8 6L4 10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
