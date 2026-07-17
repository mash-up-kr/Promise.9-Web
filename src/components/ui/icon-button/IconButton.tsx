import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";

import { GlassView } from "@/components/ui/glass-view/GlassView";
import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

// Figma 헤더 아이콘 버튼: rgba(18,18,18,0.5) + blur(4) 유리 + inset 하이라이트.
// 아이콘·하이라이트는 GlassView 의 자식으로 둔다 — 웹에서 svg(static)가 absolute 유리 레이어
// (backdrop-filter 스태킹)에 가려지는 문제를 피하려면 형제가 아니라 자식이어야 blur 위에 그려진다.
const containerStyles = tv({
  base: "size-10 overflow-hidden rounded-full",
});

export interface IconButtonProps extends Omit<PressableProps, "children"> {
  iconNode: IconComponent;
  accessibilityLabel: string;
  className?: string;
}

export function IconButton({ iconNode, className, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={containerStyles({ class: className })}
      {...props}
    >
      <GlassView
        intensity={55}
        className="size-full items-center justify-center"
      >
        <View
          pointerEvents="none"
          className="absolute inset-0 rounded-full shadow-[-1px_-1px_1px_0_var(--color-opacity-white-20)_inset,1px_1px_1px_0_var(--color-opacity-white-20)_inset]"
        />
        <Icon
          iconNode={iconNode}
          size={24}
          strokeWidth={1.5}
          className="text-icon-strong"
        />
      </GlassView>
    </Pressable>
  );
}
