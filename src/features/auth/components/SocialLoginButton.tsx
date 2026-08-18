import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";

import { Spinner } from "@/components/ui/spinner/Spinner";
import { Text } from "@/components/ui/text/Text";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { tv } from "@/lib/tv";

import type { SocialProvider } from "../auth.constants";
import { SOCIAL_ICON } from "./icons";

// provider별 배경. 텍스트·아이콘은 모두 밝은 배경 위라 공통(검은 텍스트).
const buttonStyles = tv({
  base: "relative h-12 flex-row items-center justify-center rounded-full px-4",
  variants: {
    provider: {
      kakao: "bg-kakao-yellow",
      google: "bg-opacity-white-100",
      apple: "bg-opacity-white-100",
    },
    dimmed: {
      true: "opacity-40",
    },
  },
});

export interface SocialLoginButtonProps
  extends Omit<PressableProps, "children" | "onPress" | "disabled"> {
  provider: SocialProvider;
  label: string;
  onPress: (provider: SocialProvider) => void;
  /** 이 버튼이 로그인 진행 중 — 아이콘·라벨 대신 스피너를 보여준다. */
  loading?: boolean;
  /** 비활성(다른 로그인 진행 중이거나 아직 지원하지 않는 provider). */
  disabled?: boolean;
}

export function SocialLoginButton({
  provider,
  label,
  onPress,
  loading = false,
  disabled = false,
  className,
  ...props
}: SocialLoginButtonProps) {
  const Icon = SOCIAL_ICON[provider];
  // 로딩 중인 버튼은 흐리게 하지 않는다(진행 중인 당사자). 그 외 비활성만 dim.
  const dimmed = disabled && !loading;
  // Figma Spinner 주석: 응답 200ms 미만이면 스피너 생략, 200ms 이상이면 표시하되 최소 300ms 유지.
  // disabled/accessibilityState 는 즉시(raw loading) 반영해 탭은 바로 막되, 스피너 표시만 지연시킨다.
  const showSpinner = useDelayedLoading(loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={() => onPress(provider)}
      className={buttonStyles({ provider, dimmed, class: className })}
      // 눌림 피드백(시안 pressed 상태) — 정확한 틴트 토큰이 없어 opacity 로 근사한다.
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
      {...props}
    >
      {showSpinner ? (
        <Spinner size="medium" tone="on-light" />
      ) : (
        <>
          {/* 아이콘은 좌측 고정, 라벨은 버튼 전체 기준 중앙(시안 배치). */}
          <View className="absolute left-4">
            <Icon width={24} height={24} />
          </View>
          <Text variant="heading-3-medium" className="text-opacity-black-100">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
