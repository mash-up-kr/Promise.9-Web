import { Plus } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

export interface ListSectionAction {
  label: string;
  onPress: () => void;
}

// 가로 여백은 보관함 화면 기준(px-5)이지만, 이미 여백을 가진 컨테이너(폴더 이동 시트) 안에서는
// 이중으로 들어가므로 끈다.
const sectionStyles = tv({
  base: "gap-3",
  variants: { inset: { true: "px-5" } },
  defaultVariants: { inset: true },
});

export interface ListSectionProps {
  title: string;
  action?: ListSectionAction;
  /** 기본 true. 이미 가로 여백을 가진 컨테이너 안에서는 false. */
  inset?: boolean;
  className?: string;
  children: ReactNode;
}

// Figma "Section" — 섹션 타이틀 + optional 액션(+) + 그룹. 보관함·설정 공용.
export function ListSection({
  title,
  action,
  inset,
  className,
  children,
}: ListSectionProps) {
  return (
    <View className={sectionStyles({ inset, class: className })}>
      <View className="flex-row items-center justify-between">
        <Text variant="heading-2" className="text-text-normal">
          {title}
        </Text>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
          >
            <Icon iconNode={Plus} size={24} className="text-icon-accent" />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
