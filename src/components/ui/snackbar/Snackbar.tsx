import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text/Text";

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarProps {
  message: string;
  icon?: ReactNode;
  action?: SnackbarAction;
}

// Figma Snackbar: gray-600 필, 메시지(Regular 14) + 좌측 아이콘(선택) + 우측 액션(SemiBold 13 · gray-50).
export function Snackbar({ message, icon, action }: SnackbarProps) {
  return (
    <View className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-gray-600 px-4 py-3 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.35)]">
      {icon ? (
        <View className="size-5 shrink-0 items-center justify-center">
          {icon}
        </View>
      ) : null}
      <Text variant="body-2-reading" className="flex-1">
        {message}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Text variant="label-2-semibold" className="text-gray-50">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
