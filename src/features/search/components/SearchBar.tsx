import { Search } from "lucide-react-native";
import type { TextInputProps } from "react-native";
import { TextInput, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

const searchBarStyles = tv({
  base: "h-10 flex-1 flex-row items-center rounded-full bg-background-input px-3",
});

// placeholder 색은 RN 특성상 prop 으로만 지정 가능 — text-assistive(gray-400) 토큰 값
const PLACEHOLDER_COLOR = "#65656b";

export interface SearchBarProps extends Omit<TextInputProps, "className"> {
  className?: string;
}

export function SearchBar({
  className,
  placeholder = "검색",
  ...props
}: SearchBarProps) {
  return (
    <View className={searchBarStyles({ class: className })}>
      <Icon
        iconNode={Search}
        size={24}
        strokeWidth={1.5}
        className="text-icon-assistive"
      />
      <TextInput
        accessibilityRole="search"
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER_COLOR}
        className="flex-1 font-pretendard-medium text-base text-text-strong"
        {...props}
      />
    </View>
  );
}
