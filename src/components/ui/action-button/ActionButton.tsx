import { useState } from "react";
import { Pressable, type PressableProps, View } from "react-native";

import { Spinner } from "@/components/ui/spinner/Spinner";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

// Figma Action Button 통합(Button/Primary·Assistive·Destructive + Alert Button).
// State 축(Default/Pressed/Loading/Disabled)은 prop 이 아니라 각기 다른 출처의 런타임 상태로 다룬다:
// Pressed=onPressIn/onPressOut, Loading=isLoading prop, Disabled=disabled prop.
//
// 색 토큰 매핑 (2026-08-13, PR#59 토큰 반영 후):
// - Destructive 배경/라벨은 semantic 토큰(action-destructive*)이 신설되어 그대로 매핑.
// - Primary 라벨(#242426)은 Figma 자체가 semantic 이 아니라 gray-800 primitive 를 직접 참조한다
//   (get_variable_defs 결과 "gray/gray-800" — semantic 이름 없음). semantic 후보도 없어
//   Snackbar.tsx 의 bg-gray-800 선례를 따라 primitive 를 그대로 쓴다.
const containerStyles = tv({
  base: "flex-row items-center justify-center overflow-hidden rounded-full px-4",
  variants: {
    // 너비는 지정하지 않는다 — height/padding/min-width 만 컴포넌트가 소유한다.
    // 가로는 호출부(부모 레이아웃)가 결정한다.
    size: {
      small: "h-11 min-w-[60px] py-2.5",
      medium: "h-12 min-w-[132px] py-3",
    },
    variant: {
      primary: "",
      assistive: "",
      destructive: "bg-action-destructive-background",
    },
    // Pressed·Loading 배경이 동일해 하나의 불리언으로 묶는다.
    isActive: { true: "", false: "" },
    isDisabled: { true: "", false: "" },
  },
  compoundVariants: [
    {
      variant: "primary",
      isActive: false,
      isDisabled: false,
      class: "bg-opacity-white-100",
    },
    {
      variant: "primary",
      isActive: true,
      isDisabled: false,
      class: "bg-gray-100",
    },
    {
      variant: "assistive",
      isActive: false,
      isDisabled: false,
      class: "bg-gray-600",
    },
    {
      variant: "assistive",
      isActive: true,
      isDisabled: false,
      class: "bg-gray-500",
    },
    // destructive 의 active 는 별도 오버레이 레이어로 처리한다(base 배경 유지).
    { variant: "primary", isDisabled: true, class: "bg-gray-200" },
    { variant: "assistive", isDisabled: true, class: "bg-gray-400" },
    { variant: "destructive", isDisabled: true, class: "bg-gray-400" },
  ],
  defaultVariants: { size: "medium", variant: "primary" },
});

// 타이포(size/line-height/weight/tracking)는 Text 의 variant="heading-3-medium" 이 맡는다.
// 여기서는 색만 다룬다.
const labelStyles = tv({
  variants: {
    variant: {
      primary: "text-gray-800",
      assistive: "text-text-strong",
      destructive: "text-action-destructive",
    },
    isDisabled: { true: "", false: "" },
    // 로딩 중에도 라벨은 자리를 차지해야 버튼 폭이 유지된다.
    isHidden: { true: "opacity-0", false: "" },
  },
  compoundVariants: [
    { variant: "primary", isDisabled: true, class: "text-text-assistive" },
    { variant: "assistive", isDisabled: true, class: "text-text-neutral" },
    { variant: "destructive", isDisabled: true, class: "text-text-neutral" },
  ],
});

export interface ActionButtonProps
  extends Omit<PressableProps, "children" | "style"> {
  label: string;
  /** 기본 medium */
  size?: "small" | "medium";
  /** 기본 primary */
  variant?: "primary" | "assistive" | "destructive";
  /** 로딩 중에는 라벨을 숨기고 Spinner 를 보여주며, 자동으로 press 가 막힌다. */
  isLoading?: boolean;
  /**
   * 너비는 여기로 주입한다(`w-full` · `flex-1` 등) — 컴포넌트는 height·padding·min-width 만 소유한다.
   * RN 기본(`flex-col`, `align-items: stretch`)에서는 지정하지 않아도 부모 폭을 꽉 채운다.
   * 내용만큼 줄이려면 호출부에서 `self-start` 를 준다.
   */
  className?: string;
}

export function ActionButton({
  label,
  size = "medium",
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  onPressIn,
  onPressOut,
  ...props
}: ActionButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // isDisabled = "누를 수 없음"(Loading 포함). isDimmed = "회색으로 죽은 모양"(Loading 제외).
  const isDisabled = Boolean(disabled) || isLoading;
  const isDimmed = Boolean(disabled);
  const isActive = isPressed || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPressIn={(event) => {
        setIsPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setIsPressed(false);
        onPressOut?.(event);
      }}
      className={containerStyles({
        size,
        variant,
        isActive,
        isDisabled: isDimmed,
        class: className,
      })}
      {...props}
    >
      {variant === "destructive" && isActive && !isDimmed && (
        <View
          pointerEvents="none"
          className="absolute inset-0 bg-opacity-white-10"
        />
      )}

      <Text
        variant="heading-3-medium"
        className={labelStyles({
          variant,
          isDisabled: isDimmed,
          isHidden: isLoading,
        })}
      >
        {label}
      </Text>

      {isLoading && (
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
        >
          <Spinner
            size={size === "medium" ? "medium" : "small"}
            tone={variant === "primary" ? "on-light" : "on-dark"}
          />
        </View>
      )}
    </Pressable>
  );
}
