import { Pressable, ScrollView } from "react-native";

import { HStack } from "@/components/ui/hstack/HStack";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

import { CATEGORY_TABS, type CategoryTab } from "../search.constants";

const tabStyles = tv({
  base: "h-9 items-center justify-center rounded-full px-3",
  variants: {
    isSelected: {
      true: "bg-opacity-white-100",
      false: "bg-background-input",
    },
  },
});

const tabTextStyles = tv({
  variants: {
    isSelected: {
      true: "text-gray-900",
      false: "text-opacity-white-80",
    },
  },
});

export interface CategoryTabBarProps {
  selected: CategoryTab;
  onSelect: (tab: CategoryTab) => void;
}

/** 카테고리 탭바 — '전체' 포함 탭을 가로로 넘기며 하나를 선택한다. */
export function CategoryTabBar({ selected, onSelect }: CategoryTabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // 웹에서 가로 ScrollView 높이가 0 으로 붕괴해 칩이 잘리므로 콘텐츠 높이만큼 고정한다.
      className="h-14 shrink-0 grow-0"
    >
      <HStack className="gap-1 px-5 pt-1 pb-3">
        {CATEGORY_TABS.map((tab) => {
          const isSelected = tab === selected;
          return (
            <Pressable
              key={tab}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(tab)}
              className={tabStyles({ isSelected })}
            >
              <Text
                variant="label-2-medium"
                className={tabTextStyles({ isSelected })}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    </ScrollView>
  );
}
