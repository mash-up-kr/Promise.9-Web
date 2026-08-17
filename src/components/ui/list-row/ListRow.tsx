import { ChevronRight } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

// Figma "List Row" — 좌: leading(선택) + 라벨, 우: trailing(값/개수) + chevron(선택).
// 보관함 폴더 목록·설정 목록이 공유하는 행 프리미티브.
const rowStyles = tv({
  base: "h-[52px] flex-row items-center justify-between px-4 py-3",
  variants: {
    isPressed: {
      true: "bg-background-list-selected",
      false: "bg-background-list",
    },
  },
});

const labelStyles = tv({
  base: "",
  variants: {
    tone: {
      normal: "text-text-normal",
      destructive: "text-action-destructive",
    },
  },
});

export interface ListRowProps {
  label: string;
  /** 좌측 슬롯(폴더 아이콘 등). 없으면 라벨만. */
  leading?: ReactNode;
  /** 우측 값 슬롯(이메일·개수·버전 등). chevron 앞에 온다. */
  trailing?: ReactNode;
  /** 우측 끝 이동 표식(>). */
  chevron?: boolean;
  /** 라벨 색. destructive = 회원 탈퇴 등. */
  tone?: "normal" | "destructive";
  onPress?: () => void;
  disabled?: boolean;
  /** 미지정 시 label 을 접근성 이름으로 쓴다. */
  accessibilityLabel?: string;
}

export function ListRow({
  label,
  leading,
  trailing,
  chevron = false,
  tone = "normal",
  onPress,
  disabled = false,
  accessibilityLabel,
}: ListRowProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={rowStyles({ isPressed })}
    >
      <View className="flex-row items-center gap-3">
        {leading}
        <Text variant="body-2-normal" className={labelStyles({ tone })}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        {trailing}
        {chevron ? (
          <View testID="list-row-chevron">
            <Icon
              iconNode={ChevronRight}
              size={16}
              className="text-icon-assistive"
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
