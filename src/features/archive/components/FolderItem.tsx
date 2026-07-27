import { FOLDER_TONE_HEX } from "@shared/folder/folder.colors";
import type { FolderColor } from "@shared/types/link.types";
import { ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

// 폴더 아이콘 채움색(raw hex). 12색은 shared 팔레트(= global.css --color-folder-*-solid)를 그대로 쓰고,
// gray(시스템 폴더)만 목록 전용 회색을 쓴다.
const GRAY_FILL = "#65656b";
const TONE_FILL: Record<FolderColor, string> = {
  gray: GRAY_FILL,
  ...FOLDER_TONE_HEX,
};

/** 폴더 tone → 아이콘 채움 hex. */
export function folderToneFill(tone: FolderColor): string {
  return TONE_FILL[tone];
}

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
  tone?: FolderColor;
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
        <FolderIcon color={folderToneFill(tone)} size={28} />
        <Text variant="body-2-normal" className="text-text-normal">
          {name}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text variant="body-2-normal" className="text-text-alternative">
          {count}
        </Text>
        <Icon
          iconNode={ChevronRight}
          size={16}
          className="text-icon-assistive"
        />
      </View>
    </Pressable>
  );
}
