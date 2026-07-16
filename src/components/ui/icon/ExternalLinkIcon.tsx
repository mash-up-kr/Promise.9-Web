import { ExternalLink } from "lucide-react-native";

export interface ExternalLinkIconProps {
  size?: number;
  color?: string;
}

export function ExternalLinkIcon({
  size = 16,
  color = "#E9E9EB",
}: ExternalLinkIconProps) {
  return <ExternalLink size={size} color={color} strokeWidth={1.3} />;
}
