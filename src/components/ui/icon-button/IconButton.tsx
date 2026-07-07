import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

// backdrop blur 는 네이티브가 지원하지 않아 반투명 배경+보더로 근사하고, 웹에서만 적용한다.
// inset 하이라이트(box-shadow)는 RN New Arch 의 boxShadow 로 네이티브에서도 렌더된다.
const iconButtonStyles = tv({
  base: "size-10 items-center justify-center rounded-full border border-opacity-white-10 bg-opacity-white-05 shadow-[-1px_-1px_1px_0_var(--color-opacity-white-20)_inset,1px_1px_1px_0_var(--color-opacity-white-20)_inset] web:backdrop-blur-[2px]",
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
      <Icon
        iconNode={iconNode}
        size={24}
        strokeWidth={1.5}
        className="text-icon-strong"
      />
    </Pressable>
  );
}
