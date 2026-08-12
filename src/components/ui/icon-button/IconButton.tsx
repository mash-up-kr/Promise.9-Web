import { useState } from "react";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

// Figma Icon Button: 40 원형 gray-700 + 아이콘 24 icon-strong.
// Pressed(전 플랫폼)·Hover(웹 포인터 전용)는 배경을 gray-600 으로 스왑하고,
// Pressed 는 추가로 전체(배경+아이콘) scale(1.1) — 100ms ease-out 진입, 120ms 복귀.
export const iconButtonStyles = tv({
  base: "size-10 items-center justify-center rounded-full",
  variants: {
    active: {
      true: "bg-gray-600",
      false: "bg-gray-700",
    },
  },
});

const PRESS_SCALE = 1.1;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 120;

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
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={(event) => {
        setIsPressed(true);
        scale.value = withTiming(PRESS_SCALE, {
          duration: PRESS_IN_MS,
          easing: Easing.out(Easing.ease),
        });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setIsPressed(false);
        scale.value = withTiming(1, {
          duration: PRESS_OUT_MS,
          easing: Easing.out(Easing.ease),
        });
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
        style={scaleStyle}
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
