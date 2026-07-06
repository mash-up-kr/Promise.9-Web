import { styled } from "nativewind";
import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

interface SvgIconProps extends SvgProps {
  size?: string | number;
}

// 아이콘으로 쓸 수 있는 컴포넌트 타입. lucide 아이콘도 SvgProps 호환이라 그대로 쓸 수 있다.
type SvgIconComponent = ComponentType<SvgIconProps>;

const iconStyleMapping = {
  className: { target: "style", nativeStyleMapping: { color: "color" } },
} as const;

const styledIconCache = new WeakMap<SvgIconComponent, SvgIconComponent>();

function getStyledIcon(icon: SvgIconComponent): SvgIconComponent {
  let StyledIcon = styledIconCache.get(icon);
  if (!StyledIcon) {
    StyledIcon = styled(icon, iconStyleMapping) as SvgIconComponent;
    styledIconCache.set(icon, StyledIcon);
  }
  return StyledIcon;
}

export interface IconProps extends Omit<SvgIconProps, "className"> {
  icon: SvgIconComponent;
  className?: string;
}

export function Icon({ icon, className, size = 18, ...props }: IconProps) {
  const StyledIcon = getStyledIcon(icon);
  return <StyledIcon className={className} size={size} {...props} />;
}
