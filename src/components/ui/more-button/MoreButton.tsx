import { Ellipsis } from "lucide-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

// Figma "More Button": 20 원형 gray-600 + 12 ellipsis.
const moreButtonStyles = tv({
  base: "size-5 items-center justify-center rounded-full bg-gray-600",
});

export interface MoreButtonProps {
  /** 무엇의 메뉴인지 밝혀야 하므로 라벨은 호출부가 정한다("폴더 메뉴 열기" 등). */
  accessibilityLabel: string;
  onPress: () => void;
  className?: string;
}

/** 컨텍스트 메뉴를 여는 "..." 버튼 — 웹에서 포인터를 올렸을 때만 노출한다(모바일은 롱프레스). */
export function MoreButton({
  accessibilityLabel,
  onPress,
  className,
}: MoreButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={moreButtonStyles({ class: className })}
    >
      <Icon iconNode={Ellipsis} size={12} className="text-icon-normal" />
    </Pressable>
  );
}
