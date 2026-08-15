import { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";
import Animated from "react-native-reanimated";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { usePressedScale } from "@/hooks/usePressedScale";
import { tv } from "@/lib/tv";

// Figma Icon Button: 40 원형 gray-700 + 아이콘 24 icon-strong.
// Pressed(전 플랫폼)·Hover(웹 포인터 전용)는 배경을 gray-600 으로 스왑하고,
// Pressed 는 추가로 전체(배경+아이콘) scale(1.1) — usePressedScale.
export const iconButtonStyles = tv({
  base: "size-10 items-center justify-center rounded-full",
  variants: {
    active: {
      true: "bg-gray-600",
      false: "bg-gray-700",
    },
  },
});

export interface IconButtonProps extends Omit<PressableProps, "children"> {
  iconNode: IconComponent;
  accessibilityLabel: string;
  className?: string;
  /** 아이콘 내부 채움. 즐겨찾기 별처럼 on/off 를 채움으로 구분할 때만 쓴다(기본: 채우지 않음). */
  iconFill?: string;
}

export function IconButton({
  iconNode,
  className,
  iconFill = "none",
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...props
}: IconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isPressed, pressedScaleStyle, handlePressIn, handlePressOut } =
    usePressedScale();

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={(event) => {
        handlePressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        handlePressOut();
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        setIsHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setIsHovered(false);
        onHoverOut?.(event);
      }}
      {...props}
    >
      <Animated.View
        style={pressedScaleStyle}
        className={iconButtonStyles({
          active: isPressed || isHovered,
          class: className,
        })}
      >
        <Icon
          iconNode={iconNode}
          size={24}
          strokeWidth={1.5}
          fill={iconFill}
          className="text-icon-strong"
        />
      </Animated.View>
    </Pressable>
  );
}
