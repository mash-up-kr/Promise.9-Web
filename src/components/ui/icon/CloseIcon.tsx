import { X } from "lucide-react-native";

export interface CloseIconProps {
  size?: number;
  color?: string;
}

export function CloseIcon({ size = 10, color = "#ffffff" }: CloseIconProps) {
  return <X size={size} color={color} strokeWidth={2} strokeOpacity={0.6} />;
}
