import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { FolderIcon } from "@/components/ui/icon/FolderIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { folderQueries } from "@/entities/folder/folder.queries";
import { tv } from "@/lib/tv";

// 미분류 folder 아이콘 색 = folder/gray(#65656b), FolderBadge 와 동일한 Figma 기준.
const UNCLASSIFIED_ICON_COLOR = "#65656B";

const chipStyles = tv({
  base: "h-10 flex-row items-center gap-1.5 rounded-full px-4",
  variants: {
    isSelected: { true: "bg-opacity-white-20", false: "bg-opacity-white-10" },
  },
});

export interface FolderChipListProps {
  value: number | null;
  onChange: (folderId: number | null) => void;
}

export function FolderChipList({ value, onChange }: FolderChipListProps) {
  const router = useRouter();
  const { data } = useSuspenseQuery(folderQueries.list());
  const folders = data.folders;

  // 시트가 열린 동안 목록에 새로 나타난 폴더는 방금 생성된 것 — 자동 선택(시안 정책).
  const knownIdsRef = useRef<Set<number> | null>(null);
  useEffect(() => {
    const ids = new Set(folders.map((folder) => folder.folderId));
    const known = knownIdsRef.current;
    knownIdsRef.current = ids;
    if (!known) return;
    const created = folders.find((folder) => !known.has(folder.folderId));
    if (created) onChange(created.folderId);
  }, [folders, onChange]);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text variant="heading-3">폴더</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="폴더 추가"
          hitSlop={8}
          onPress={() => router.push("/create-folder")}
        >
          <Icon iconNode={Plus} size={20} className="text-icon-accent" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          <FolderChip
            label="미분류"
            iconColor={UNCLASSIFIED_ICON_COLOR}
            isSelected={value === null}
            onPress={() => onChange(null)}
          />
          {folders.map((folder) => (
            <FolderChip
              key={folder.folderId}
              label={folder.folderName}
              iconColor={folder.color}
              isSelected={value === folder.folderId}
              onPress={() => onChange(folder.folderId)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

interface FolderChipProps {
  label: string;
  iconColor: string;
  isSelected: boolean;
  onPress: () => void;
}

function FolderChip({
  label,
  iconColor,
  isSelected,
  onPress,
}: FolderChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className={chipStyles({ isSelected })}
    >
      <FolderIcon color={iconColor} />
      <Text
        variant="body-2-normal"
        className={isSelected ? "text-text-strong" : "text-text-assistive"}
      >
        {label}
      </Text>
    </Pressable>
  );
}
