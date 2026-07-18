import type { FolderColor } from "@shared/types/link.types";
import { ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

// 폴더 아이콘 색(raw hex). 보관함 목록은 gray·blue 만 쓰고 나머지는 gray 로 폴백.
// 색 출처: global.css --color-folder-gray / --color-folder-blue-solid (Figma 동기화 토큰).
const GRAY_FILL = "#65656b";
const BLUE_FILL = "#61a8ef";
const TONE_FILL: Partial<Record<FolderColor, string>> = {
  gray: GRAY_FILL,
  blue: BLUE_FILL,
};

// 지속되는 선택 상태는 두지 않고, 탭하는 순간에만 잠깐 selected 색으로 바뀌는 press 피드백만 준다.
const folderItemStyles = tv({
  base: "h-[52px] flex-row items-center justify-between bg-background-thumbnail px-4 py-3 active:bg-background-list-selected",
});

export interface FolderItemProps {
  name: string;
  count: number;
  tone?: FolderColor;
  onPress?: () => void;
}

export function FolderItem({
  name,
  count,
  tone = "gray",
  onPress,
}: FolderItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={folderItemStyles()}
    >
      <View className="flex-row items-center gap-3">
        <FolderIcon color={TONE_FILL[tone] ?? GRAY_FILL} size={28} />
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
