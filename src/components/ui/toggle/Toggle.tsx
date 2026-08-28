import { Pressable, View } from "react-native";

import { tv } from "@/lib/tv";

// Figma Toggle Switch: 44×24 pill. RN Switch 는 플랫폼별 렌더가 달라 시안(트랙 On=gray-50/
// Off=gray-400, 노브 On=20px/Off=16px 모두 gray-800)을 표현할 수 없어 직접 그린다.
const trackStyles = tv({
  base: "h-6 w-11 flex-row items-center rounded-full",
  variants: {
    isOn: {
      true: "justify-end bg-gray-50 p-0.5",
      false: "justify-start bg-gray-400 p-1",
    },
  },
});

const knobStyles = tv({
  base: "rounded-full bg-gray-800",
  variants: {
    isOn: {
      true: "size-5",
      false: "size-4",
    },
  },
});

export interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onChange(!value)}
      className={trackStyles({ isOn: value })}
    >
      <View className={knobStyles({ isOn: value })} />
    </Pressable>
  );
}
