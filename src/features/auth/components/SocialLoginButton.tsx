import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

import type { SocialProvider } from "../auth.constants";

const buttonStyles = tv({
  base: "h-12 items-center justify-center rounded-xl bg-gray-800",
  variants: {
    disabled: {
      true: "opacity-40",
    },
  },
});

export interface SocialLoginButtonProps
  extends Omit<PressableProps, "children" | "onPress" | "disabled"> {
  provider: SocialProvider;
  label: string;
  onPress: (provider: SocialProvider) => void;
  disabled?: boolean;
}

export function SocialLoginButton({
  provider,
  label,
  onPress,
  disabled,
  className,
  ...props
}: SocialLoginButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onPress(provider)}
      className={buttonStyles({ disabled, class: className })}
      {...props}
    >
      <Text variant="label-1" className="text-text-inverse">
        {label}
      </Text>
    </Pressable>
  );
}
