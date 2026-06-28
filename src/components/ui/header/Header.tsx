import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

const headerStyles = tv({
  base: "h-14 flex-row items-center justify-between px-4",
});

export interface HeaderProps {
  left?: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function Header({ left, title, right, className }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <View className={headerStyles({ class: className })}>
        <View className="min-w-10 flex-row items-center">{left}</View>

        <View className="flex-1 items-center">
          {typeof title === "string" ? (
            <Text variant="title" className="text-text-strong">
              {title}
            </Text>
          ) : (
            title
          )}
        </View>

        <View className="min-w-10 flex-row items-center justify-end gap-2">
          {right}
        </View>
      </View>
    </View>
  );
}
