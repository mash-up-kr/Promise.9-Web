import type { LucideIcon, LucideProps } from "lucide-react-native";
import { styled } from "nativewind";
import type { ComponentType } from "react";

import type { SvgIconProps } from "./icons";

// 아이콘으로 쓸 수 있는 컴포넌트 타입.
// lucide 아이콘 + Figma 기반 react-native-svg 아이콘(icons/) 을 함께 받는다.
// 둘 다 className→color 매핑으로 color(=currentColor) 를 주입받는다.
export type IconComponent = LucideIcon | ComponentType<SvgIconProps>;

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
