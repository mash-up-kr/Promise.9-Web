import { Pressable, View } from "react-native";

import { HStack } from "@/components/ui/hstack/HStack";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

import { SearchChip } from "./SearchChip";

export interface RecentSearchesSectionProps {
  keywords: string[];
  onPressKeyword: (keyword: string) => void;
  onClearAll: () => void;
}

/** 최근 검색어 섹션 — 검색어 칩 목록과 '모두 지우기'. 검색어가 없으면 렌더하지 않는다. */
export function RecentSearchesSection({
  keywords,
  onPressKeyword,
  onClearAll,
}: RecentSearchesSectionProps) {
  if (keywords.length === 0) {
    return null;
  }

  return (
    <VStack className="gap-3">
      <HStack className="items-center justify-between">
        <Text variant="heading-2">최근 검색어</Text>
        <Pressable accessibilityRole="button" onPress={onClearAll}>
          <Text variant="body-3" className="text-text-assistive">
            모두 지우기
          </Text>
        </Pressable>
      </HStack>
      <View className="flex-row flex-wrap gap-x-1.5 gap-y-2">
        {keywords.map((keyword) => (
          <SearchChip
            key={keyword}
            keyword={keyword}
            onPress={() => onPressKeyword(keyword)}
          />
        ))}
      </View>
    </VStack>
  );
}
