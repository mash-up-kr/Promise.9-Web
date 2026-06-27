import type { LucideIcon, LucideProps } from "lucide-react-native";

// 아이콘으로 쓸 수 있는 컴포넌트 타입.
// 현재는 lucide 아이콘만. 추후 svg 파일(react-native-svg) 컴포넌트가 들어오면 이 union 에 추가한다.
export type IconNode = LucideIcon;

export interface IconProps extends LucideProps {
  iconNode: IconNode;
}

export function Icon({
  iconNode: IconComponent,
  size = 18,
  ...rest
}: IconProps) {
  return <IconComponent size={size} {...rest} />;
}
