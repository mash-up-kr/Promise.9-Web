import { Search } from "lucide-react-native";
import type { TextInputProps } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Input, InputField, InputSlot } from "@/components/ui/input/Input";
import { tv } from "@/lib/tv";

const searchBarStyles = tv({
  base: "gap-2",
});

export interface SearchBarProps extends Omit<TextInputProps, "className"> {
  className?: string;
}

export function SearchBar({
  className,
  placeholder = "검색",
  ...props
}: SearchBarProps) {
  return (
    <Input variant="pill" className={searchBarStyles({ class: className })}>
      <InputSlot>
        <Icon
          iconNode={Search}
          size={16}
          strokeWidth={1.5}
          // Figma 스펙: 아이콘 색은 white-100 변수 바인딩 (semantic 토큰 정리 시 교체)
          className="text-opacity-white-100"
        />
      </InputSlot>
      <InputField
        accessibilityRole="search"
        returnKeyType="search"
        placeholder={placeholder}
        {...props}
      />
    </Input>
  );
}
