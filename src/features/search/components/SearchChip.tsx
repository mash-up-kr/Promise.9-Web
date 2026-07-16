import { Pressable } from "react-native";

import { Text } from "@/components/ui/text/Text";

export interface SearchChipProps {
  keyword: string;
  onPress?: () => void;
}

/** 최근 검색어 칩 — 보더 pill. 누르면 해당 키워드로 검색한다. */
export function SearchChip({ keyword, onPress }: SearchChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-8 items-center justify-center rounded-full border border-opacity-white-30 px-3"
    >
      <Text variant="caption-1">{keyword}</Text>
    </Pressable>
  );
}
