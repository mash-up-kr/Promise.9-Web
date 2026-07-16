import { ChevronUp } from "lucide-react-native";

const ROTATION_BY_DIRECTION = {
  up: "0deg",
  right: "90deg",
  down: "180deg",
  left: "270deg",
} as const;

export interface ChevronIconProps {
  /** true 면 180도 회전(아래 방향)해서 보여준다. 기본은 위 방향. `direction` 이 있으면 무시된다. */
  rotated?: boolean;
  /** 화살표 방향. 지정 시 `rotated` 보다 우선한다. 기본은 위(`up`). */
  direction?: keyof typeof ROTATION_BY_DIRECTION;
  size?: number;
  color?: string;
}

export function ChevronIcon({
  rotated = false,
  direction,
  size = 16,
  color = "#8A8A93",
}: ChevronIconProps) {
  const angle = direction
    ? ROTATION_BY_DIRECTION[direction]
    : rotated
      ? "180deg"
      : "0deg";
  return (
    <ChevronUp
      size={size}
      color={color}
      strokeWidth={1.5}
      style={angle !== "0deg" ? { transform: [{ rotate: angle }] } : undefined}
    />
  );
}
