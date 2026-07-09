import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { ChevronRightIcon, FolderIcon } from "@/components/ui/icon/icons";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

import type { FolderTone } from "../types";

const toneColor: Record<FolderTone, string> = {
  gray: "text-folder-gray",
  blue: "text-folder-blue-solid",
};

const folderItemStyles = tv({
  base: "h-[52px] flex-row items-center justify-between px-4 py-3",
  variants: {
    selected: {
      true: "bg-background-list-selected",
      false: "bg-background-thumbnail",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export interface FolderItemProps {
  name: string;
  count: number;
  tone?: FolderTone;
  selected?: boolean;
  onPress?: () => void;
}

export function FolderItem({
  name,
  count,
  tone = "gray",
  selected = false,
  onPress,
}: FolderItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={folderItemStyles({ selected })}
    >
      <View className="flex-row items-center gap-3">
        <Icon iconNode={FolderIcon} size={28} className={toneColor[tone]} />
        <Text variant="body-2" className="text-text-normal">
          {name}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text variant="body-2" className="text-text-alternative">
          {count}
        </Text>
        <Icon
          iconNode={ChevronRightIcon}
          size={16}
          className="text-icon-assistive"
        />
      </View>
    </Pressable>
  );
}
