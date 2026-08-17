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

  // 동작(onPress) 없는 행(이메일·버전 정보 등)은 눌러도 반응이 없으므로
  // 스크린리더에 버튼으로 읽히지 않게 하고 press 하이라이트도 걸지 않는다.
  const isInteractive = onPress != null;

  return (
    <Pressable
      accessibilityRole={isInteractive ? "button" : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={isInteractive ? { disabled } : undefined}
      disabled={disabled || !isInteractive}
      onPress={onPress}
      onPressIn={isInteractive ? () => setIsPressed(true) : undefined}
      onPressOut={isInteractive ? () => setIsPressed(false) : undefined}
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
