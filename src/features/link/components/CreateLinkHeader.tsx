import { Pressable } from "react-native";

import { HStack } from "@/components/ui/hstack/HStack";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

const submitButtonStyles = tv({
  base: "rounded-full px-4 py-2",
  variants: {
    disabled: { true: "bg-blue-700", false: "bg-blue-500" },
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
        className="rounded-full bg-background-input px-4 py-2"
      >
        <Text variant="label-1" className="text-text-strong">
          취소
        </Text>
      </Pressable>
      <Text variant="label-1" className="text-text-strong">
        링크 저장
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="저장"
        accessibilityState={{ disabled: saveDisabled }}
        disabled={saveDisabled}
        onPress={onSave}
        className={submitButtonStyles({ disabled: saveDisabled })}
      >
        <Text
          variant="label-1"
          className={saveDisabled ? "text-gray-200" : "text-gray-50"}
        >
          저장
        </Text>
      </Pressable>
    </HStack>
  );
}
