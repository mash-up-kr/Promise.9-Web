import { ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { VStack } from "@/components/ui/vstack/VStack";

import { CATEGORIES, type Category } from "../search.constants";
import { CategoryChip } from "./CategoryChip";

export interface CategorySectionProps {
  onPressCategory: (category: Category) => void;
  onPressMore: () => void;
}

/** 카테고리 둘러보기 섹션 — 타이틀을 누르면 전체 둘러보기로, 칩을 누르면 해당 카테고리로 이동한다. */
export function CategorySection({
  onPressCategory,
  onPressMore,
}: CategorySectionProps) {
  return (
    <VStack className="gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="카테고리 둘러보기"
        onPress={() => onPressMore()}
        className="flex-row items-center gap-1 self-start"
      >
        <Text variant="heading-2">카테고리 둘러보기</Text>
        <Icon iconNode={ChevronRight} size={16} className="text-text-normal" />
      </Pressable>
      <View className="flex-row flex-wrap gap-x-1.5 gap-y-2.5">
        {CATEGORIES.map((category) => (
          <CategoryChip
            key={category}
            name={category}
            onPress={() => onPressCategory(category)}
          />
        ))}
      </View>
    </VStack>
  );
}
