import { Plus } from "lucide-react-native";

export interface PlusIconProps {
  size?: number;
  color?: string;
}

export function PlusIcon({ size = 12, color = "#121212" }: PlusIconProps) {
  return <Plus size={size} color={color} strokeWidth={1.3} />;
}
