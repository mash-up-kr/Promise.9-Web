import { Pressable, StyleSheet } from "react-native";
import { GlassSurface } from "@/components/ui/glass-surface/GlassSurface";
import { Icon } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

const glassIconButtonStyles = tv({
  base: "items-center justify-center rounded-full p-2",
});

type IconProps = React.ComponentProps<typeof Icon>;

export interface GlassIconButtonProps extends Omit<IconProps, "onPress"> {
  label: string;
  onPress?: () => void;
  className?: string;
}

export function GlassIconButton({
  label,
  onPress,
  className,
  ...iconProps
}: GlassIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={glassIconButtonStyles({ class: className })}
    >
      {/* 글래스는 배경 레이어로만. 터치·접근성은 Pressable, 아이콘은 전경(일반 트리). */}
      <GlassSurface style={StyleSheet.absoluteFill} />
      <Icon {...iconProps} />
    </Pressable>
  );
}
