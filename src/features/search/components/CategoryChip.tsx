import { Pressable } from "react-native";

import { Text } from "@/components/ui/text/Text";

export interface CategoryChipProps {
  name: string;
  onPress?: () => void;
}

/** 카테고리 칩 — 파란 배경의 채워진 칩. */
export function CategoryChip({ name, onPress }: CategoryChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-8 items-center justify-center rounded-2xl bg-blue-100 px-3"
    >
      <Text variant="label-2-medium" className="text-text-inverse">
        {name}
      </Text>
    </Pressable>
  );
}
