import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text/Text";

export interface ArchiveMoreMenuProps {
  onEdit: () => void;
  onSort: () => void;
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="px-4 py-3"
    >
      <Text variant="body-2" className="text-text-normal">
        {label}
      </Text>
    </Pressable>
  );
}

// 더보기(⋯) 드롭다운. 헤더 우측 버튼 클러스터에 anchor 되어 버튼 바로 아래에 뜬다.
export function ArchiveMoreMenu({ onEdit, onSort }: ArchiveMoreMenuProps) {
  return (
    <View className="absolute top-11 right-0 z-20 min-w-[120px] overflow-hidden rounded-2xl border border-border-divider bg-background-list">
      <MenuItem label="편집" onPress={onEdit} />
      <MenuItem label="정렬" onPress={onSort} />
    </View>
  );
}
