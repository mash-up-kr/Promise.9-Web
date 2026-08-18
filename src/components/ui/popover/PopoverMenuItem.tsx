import { Pressable } from "react-native";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";

export interface PopoverMenuItemProps {
  icon: IconComponent;
  label: string;
  /** 삭제처럼 되돌릴 수 없는 동작. 아이콘·라벨을 경고색으로 바꾼다. */
  isDestructive?: boolean;
  /** 서브메뉴가 펼쳐진 동안 부모 행을 눌린 것처럼 유지한다(Figma gray-600). */
  isHighlighted?: boolean;
  /** 라벨 오른쪽 끝에 붙는 요소(펼침 화살표 등). */
  trailing?: React.ReactNode;
  onPress: () => void;
}

/** Popover 안 메뉴 한 줄 — 아이콘 20 + 라벨(Figma "More Menu" 행). */
export function PopoverMenuItem({
  icon,
  label,
  isDestructive = false,
  isHighlighted = false,
  trailing,
  onPress,
}: PopoverMenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`w-full flex-row items-center gap-3 px-5 ${
        isHighlighted ? "bg-gray-600 py-1" : ""
      }`}
    >
      <Icon
        iconNode={icon}
        size={20}
        className={
          isDestructive ? "text-action-destructive" : "text-icon-normal"
        }
      />
      <Text
        variant="body-2-normal"
        className={`flex-1 ${
          isDestructive ? "text-action-destructive" : "text-text-strong"
        }`}
      >
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}
