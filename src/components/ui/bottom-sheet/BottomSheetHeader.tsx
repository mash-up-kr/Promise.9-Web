import { Pressable, View } from "react-native";

import { Spinner } from "@/components/ui/spinner/Spinner";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

// Figma Bottom Sheet Header: 취소(Assistive)·타이틀/설명·저장(Primary).
// 버튼은 시안 Action Button Small(높이 44·최소폭 60·pill) 스펙 — 공용 Action Button
// 컴포넌트가 생기면 그쪽으로 교체한다.
export const bottomSheetHeaderButtonStyles = tv({
  base: "h-11 min-w-[60px] items-center justify-center rounded-full px-4",
  variants: {
    variant: {
      assistive: "bg-gray-700",
      primary: "bg-opacity-white-100",
    },
    isDisabled: {
      true: "",
    },
  },
  compoundVariants: [
    // 시안 Disabled: 브랜드색 대신 중립 회색으로 수렴 (Primary=gray-200 bg/gray-400 text).
    { variant: "primary", isDisabled: true, class: "bg-gray-200" },
  ],
});

const buttonLabelStyles = tv({
  base: "font-pretendard-medium text-heading-3-medium",
  variants: {
    variant: {
      assistive: "text-text-strong",
      primary: "text-gray-800",
    },
    isDisabled: {
      true: "",
    },
  },
  compoundVariants: [
    { variant: "primary", isDisabled: true, class: "text-gray-400" },
  ],
});

interface HeaderButtonProps {
  variant: "assistive" | "primary";
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  isPending?: boolean;
}

function HeaderButton({
  variant,
  label,
  onPress,
  isDisabled = false,
  isPending = false,
}: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled || isPending }}
      disabled={isDisabled || isPending}
      onPress={onPress}
      className={bottomSheetHeaderButtonStyles({ variant, isDisabled })}
    >
      {isPending ? (
        <Spinner size="medium" tone="on-light" />
      ) : (
        <Text className={buttonLabelStyles({ variant, isDisabled })}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export interface BottomSheetHeaderProps {
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirmDisabled?: boolean;
  isConfirmPending?: boolean;
}

export function BottomSheetHeader({
  title,
  description,
  cancelLabel = "취소",
  confirmLabel = "저장",
  onCancel,
  onConfirm,
  isConfirmDisabled = false,
  isConfirmPending = false,
}: BottomSheetHeaderProps) {
  return (
    <View className="h-15 flex-row items-center justify-between px-5">
      <HeaderButton
        variant="assistive"
        label={cancelLabel}
        onPress={onCancel}
      />
      <View className="flex-1 items-center justify-center gap-0.5 px-2">
        <Text variant="heading-2" className="text-center text-text-strong">
          {title}
        </Text>
        {description ? (
          <Text variant="caption-1" className="text-center text-gray-500">
            {description}
          </Text>
        ) : null}
      </View>
      <HeaderButton
        variant="primary"
        label={confirmLabel}
        onPress={onConfirm}
        isDisabled={isConfirmDisabled}
        isPending={isConfirmPending}
      />
    </View>
  );
}
