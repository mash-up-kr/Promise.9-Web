import type { FolderColor } from "@shared/types/link.types";
import { Pressable, View } from "react-native";

import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

import { folderToneFill } from "./FolderItem";

// Figma "Folder Item"(폴더 이동 시트): 52px 행 · 선택 시 배경 list-selected.
const itemStyles = tv({
  base: "h-[52px] flex-row items-center justify-between px-4 py-3",
  variants: {
    isSelected: {
      true: "bg-background-list-selected",
      false: "bg-background-list",
    },
  },
});

// Figma "Radiomark": 20px 링 + 선택 시 accent 테두리·10px 점.
// 공용 Radio 의 마크(채움 + 체크)와 모양이 다르고 행 레이아웃도 여기가 소유하므로 따로 그린다.
const markStyles = tv({
  base: "size-5 items-center justify-center rounded-full border-[1.3px]",
  variants: {
    isSelected: { true: "border-icon-accent", false: "border-gray-600" },
  },
});

export interface FolderSelectItemProps {
  name: string;
  /** 폴더 아이콘 색. 기본 폴더(미분류 등)는 회색이다. */
  tone?: FolderColor;
  isSelected?: boolean;
  onPress: () => void;
}

/** 폴더 이동 시트의 폴더 행 — 단일 선택 라디오. */
export function FolderSelectItem({
  name,
  tone = "gray",
  isSelected = false,
  onPress,
}: FolderSelectItemProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      className={itemStyles({ isSelected })}
    >
      <View className="flex-row items-center gap-3">
        <FolderIcon color={folderToneFill(tone)} size={28} />
        <Text variant="body-2-normal" className="text-text-normal">
          {name}
        </Text>
      </View>
      <View className={markStyles({ isSelected })}>
        {isSelected && (
          <View className="size-2.5 rounded-full bg-icon-accent" />
        )}
      </View>
    </Pressable>
  );
}
