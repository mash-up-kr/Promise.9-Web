import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text/Text";

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarProps {
  message: string;
  action?: SnackbarAction;
}

// Figma Snackbar: gray-800 필, 메시지(Medium 14) + 우측 액션(SemiBold 13 · blue-400).
export function Snackbar({ message, action }: SnackbarProps) {
  return (
    <View className="h-14 flex-row items-center gap-3 rounded-2xl bg-gray-800 px-4 py-3 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.35)]">
      <Text variant="body-2-normal" numberOfLines={1} className="flex-1">
        {message}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          hitSlop={8}
        >
          <Text variant="label-2-semibold" className="text-blue-400">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
