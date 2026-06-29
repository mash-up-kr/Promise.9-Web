import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heading } from "@/components/ui/heading/Heading";
import { tv } from "@/lib/tv";

const headerStyles = tv({
  base: "flex-row items-center justify-between bg-background-base px-5 py-2.5",
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
        <View className="flex-1 flex-row items-center gap-2">
          {left}
          {typeof title === "string" ? <Heading>{title}</Heading> : title}
        </View>

        <View className="flex-row items-center justify-end gap-2.5">
          {right}
        </View>
      </View>
    </View>
  );
}
