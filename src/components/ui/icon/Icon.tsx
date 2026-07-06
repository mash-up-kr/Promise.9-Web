import type { LucideIcon, LucideProps } from "lucide-react-native";
import { styled } from "nativewind";

// 아이콘으로 쓸 수 있는 컴포넌트 타입.
// 현재는 lucide 아이콘만. 추후 svg 파일(react-native-svg) 컴포넌트가 들어오면 이 union 에 추가한다.
export type IconComponent = LucideIcon;

const iconStyleMapping = {
  className: { target: "style", nativeStyleMapping: { color: "color" } },
} as const;

const styledIconCache = new WeakMap<IconComponent, IconComponent>();

function getStyledIcon(iconNode: IconComponent): IconComponent {
  let StyledIcon = styledIconCache.get(iconNode);
  if (!StyledIcon) {
    StyledIcon = styled(iconNode, iconStyleMapping) as IconComponent;
    styledIconCache.set(iconNode, StyledIcon);
  }
  return StyledIcon;
}

export interface IconProps extends Omit<LucideProps, "className"> {
  iconNode: IconComponent;
  className?: string;
}

export function Icon({ iconNode, className, size = 18, ...props }: IconProps) {
  const StyledIcon = getStyledIcon(iconNode);
  return <StyledIcon className={className} size={size} {...props} />;
}
