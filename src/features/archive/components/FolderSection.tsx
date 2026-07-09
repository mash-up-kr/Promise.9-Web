import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { PlusIcon } from "@/components/ui/icon/icons";
import { Text } from "@/components/ui/text/Text";

export interface FolderSectionAction {
  label: string;
  onPress: () => void;
}

export interface FolderSectionProps {
  title: string;
  action?: FolderSectionAction;
  children: ReactNode;
}

export function FolderSection({ title, action, children }: FolderSectionProps) {
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
            <Icon iconNode={PlusIcon} size={24} className="text-icon-accent" />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
