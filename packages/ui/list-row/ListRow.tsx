import { ChevronRight } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "../icon/Icon";
import { tv } from "../lib/tv";
import { Text } from "../text/Text";
import { type ToggleProps, ToggleTrack } from "../toggle/Toggle";

// Figma "List Row" — 좌: leading(선택) + 라벨, 우: trailing(값/개수) + chevron(선택) 또는 스위치.
// 설정 목록의 행 프리미티브(보관함 폴더 행은 FolderItem 으로 따로 구현돼 있다).
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
  /** 주면 행 전체가 스위치가 된다(누르면 반전). 시안상 trailing·chevron 과 함께 쓰지 않는다. */
  toggle?: Pick<ToggleProps, "value" | "onChange">;
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
  toggle,
  tone = "normal",
  onPress,
  disabled = false,
  accessibilityLabel,
}: ListRowProps) {
  const [isPressed, setIsPressed] = useState(false);

  // 동작(onPress) 없는 행(이메일·버전 정보 등)은 눌러도 반응이 없으므로
  // 스크린리더에 버튼으로 읽히지 않게 하고 press 하이라이트도 걸지 않는다.
  const isInteractive = onPress != null || toggle != null;

  return (
    <Pressable
      accessibilityRole={
        toggle ? "switch" : isInteractive ? "button" : undefined
      }
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        isInteractive ? { disabled, checked: toggle?.value } : undefined
      }
      // react-native-web 은 accessibilityState 를 aria 속성으로 내보내지 않는다.
      aria-checked={toggle?.value}
      disabled={disabled || !isInteractive}
      onPress={toggle ? () => toggle.onChange(!toggle.value) : onPress}
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
        {toggle ? <ToggleTrack isOn={toggle.value} /> : null}
      </View>
    </Pressable>
  );
}
