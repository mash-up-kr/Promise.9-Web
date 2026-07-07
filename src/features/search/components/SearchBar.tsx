import { Search } from "lucide-react-native";
import type { TextInputProps } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Input, InputField, InputSlot } from "@/components/ui/input/Input";

export interface SearchBarProps extends Omit<TextInputProps, "className"> {
  className?: string;
}

export function SearchBar({
  className,
  placeholder = "검색",
  ...props
}: SearchBarProps) {
  return (
    <Input className={className}>
      <InputSlot>
        <Icon
          iconNode={Search}
          size={24}
          strokeWidth={1.5}
          className="text-icon-assistive"
        />
      </InputSlot>
      <InputField
        accessibilityRole="search"
        placeholder={placeholder}
        {...props}
      />
    </Input>
  );
}
