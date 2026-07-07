import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

// backdrop blur 는 네이티브가 지원하지 않아 반투명 배경+보더로 근사하고, 웹에서만 적용한다.
const iconButtonStyles = tv({
  base: "size-10 items-center justify-center rounded-full border border-opacity-white-10 bg-opacity-white-05 web:backdrop-blur-[4px]",
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
      className={iconButtonStyles({ class: className })}
      {...props}
    >
      <Icon iconNode={iconNode} size={24} className="text-icon-strong" />
    </Pressable>
  );
}
