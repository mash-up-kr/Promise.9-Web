import { Plus } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";

export interface ListSectionAction {
  label: string;
  onPress: () => void;
}

export interface ListSectionProps {
  title: string;
  action?: ListSectionAction;
  children: ReactNode;
}

// Figma "Section" — 섹션 타이틀 + optional 액션(+) + 그룹. 보관함·설정 공용.
export function ListSection({ title, action, children }: ListSectionProps) {
  return (
    <View className="gap-3 px-5">
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
