import { Pressable, View } from "react-native";

import { GlassView } from "@/components/ui/glass-view/GlassView";
import { HStack } from "@/components/ui/hstack/HStack";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

// Figma save-sheet 헤더 버튼: h-44·rounded-full·border white-10·inset white-20 하이라이트.
// 취소는 white-05 프로스트(GlassView), 저장은 solid blue(불투명이라 blur 무의미 → 색만).
const insetHighlight =
  "shadow-[-1px_-1px_1px_0_var(--color-opacity-white-20)_inset,1px_1px_1px_0_var(--color-opacity-white-20)_inset]";

const cancelStyles = tv({
  base: "h-11 items-center justify-center overflow-hidden rounded-full border border-opacity-white-10 px-4",
});

// GlassView 프로스트가 컨테이너 inset 그림자를 가리므로 하이라이트를 별도 레이어로 올린다.
const cancelHighlightStyles = tv({
  base: `absolute inset-0 rounded-full ${insetHighlight}`,
});

const saveStyles = tv({
  base: `h-11 items-center justify-center rounded-full border border-opacity-white-10 px-4 ${insetHighlight}`,
  variants: {
    disabled: { true: "bg-blue-700", false: "bg-blue-500" },
  },
});

const saveTextStyles = tv({
  variants: {
    disabled: { true: "text-gray-200", false: "text-gray-50" },
  },
});

export interface CreateLinkHeaderProps {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled: boolean;
}

export function CreateLinkHeader({
  onCancel,
  onSave,
  saveDisabled,
}: CreateLinkHeaderProps) {
  return (
    <HStack className="items-center justify-between py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="취소"
        onPress={onCancel}
        className={cancelStyles()}
      >
        <GlassView intensity={10} tint="light" className="absolute inset-0" />
        <View pointerEvents="none" className={cancelHighlightStyles()} />
        <Text variant="label-1" className="text-text-strong">
          취소
        </Text>
      </Pressable>

      <Text variant="heading-2" className="text-text-strong">
        링크 저장
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="저장"
        accessibilityState={{ disabled: saveDisabled }}
        disabled={saveDisabled}
        onPress={onSave}
        className={saveStyles({ disabled: saveDisabled })}
      >
        <Text
          variant="label-1"
          className={saveTextStyles({ disabled: saveDisabled })}
        >
          저장
        </Text>
      </Pressable>
    </HStack>
  );
}
