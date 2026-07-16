import { Sparkle } from "lucide-react-native";

export interface SparkleIconProps {
  size?: number;
  color?: string;
}

export function SparkleIcon({
  size = 14,
  color = "#0093FF",
}: SparkleIconProps) {
  return <Sparkle size={size} color={color} fill={color} />;
}
