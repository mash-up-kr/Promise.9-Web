import { createContext, useContext } from "react";
import { View } from "react-native";

import {
  Button,
  type ButtonProps,
  useButtonState,
} from "@/components/ui/button/Button";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

// Figma Action Button(Primary·Assistive·Destructive) 스킨. 헤드리스 코어 Button 에
// 색 토큰: Destructive 는 semantic 토큰(action-destructive*). Primary 라벨(#242426)은
// Figma 가 gray-800 primitive 를 직접 참조하므로 Snackbar 선례대로 primitive 를 쓴다.
const containerStyles = tv({
  base: "flex-row items-center justify-center overflow-hidden rounded-full px-4",
  variants: {
    // 너비는 지정하지 않는다 — height/padding/min-width 만 소유. 가로는 호출부가 결정한다.
    size: {
      small: "h-11 min-w-[60px] py-2.5",
      medium: "h-12 min-w-[132px] py-3",
    },
    variant: {
      primary: "",
      assistive: "",
      destructive: "bg-action-destructive-background",
    },
    // Pressed·Loading 배경이 같아 하나로 묶는다. 아래 두 축은 compoundVariants 매칭 키.
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

// 라벨 색만 다룬다(타이포는 Text variant 가). isDimmed = disabled(Loading 제외).
const labelColorStyles = tv({
  variants: {
    variant: {
      primary: "text-gray-800",
      assistive: "text-text-strong",
      destructive: "text-action-destructive",
    },
    isDimmed: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: "primary", isDimmed: true, class: "text-text-assistive" },
    { variant: "assistive", isDimmed: true, class: "text-text-neutral" },
    { variant: "destructive", isDimmed: true, class: "text-text-neutral" },
  ],
});

type ActionVariant = "primary" | "assistive" | "destructive";
type ActionSize = "small" | "medium";

// 텍스트성 children — string · number · (string|number)[](JSX 가 "저장 {n}개" 를
// ["저장 ", n, "개"] 배열로 내려보내는 경우). 이 범위 밖(엘리먼트 조립)은 호출부가
// ActionButton.Text 로 직접 감싸야 한다.
type TextLikeChildren = string | number | (string | number)[];

function isTextLikeChildren(children: unknown): children is TextLikeChildren {
  if (typeof children === "string" || typeof children === "number") {
    return true;
  }
  return (
    Array.isArray(children) &&
    children.every(
      (child) => typeof child === "string" || typeof child === "number",
    )
  );
}

interface ActionButtonStyle {
  size: ActionSize;
  variant: ActionVariant;
}

const StyleContext = createContext<ActionButtonStyle | null>(null);

function useActionButtonStyle(): ActionButtonStyle {
  const style = useContext(StyleContext);
  if (!style) {
    throw new Error(
      "ActionButton.Text 는 <ActionButton> 안에서만 쓸 수 있습니다.",
    );
  }
  return style;
}

export interface ActionButtonProps extends Omit<ButtonProps, "className"> {
  /** 기본 medium */
  size?: ActionSize;
  /** 기본 primary */
  variant?: ActionVariant;
  /**
   * 너비 주입 통로(`w-full` · `flex-1`) — 컴포넌트는 height·padding·min-width 만 소유한다.
   * RN 기본(flex-col, stretch)에서는 미지정 시 부모 폭을 꽉 채운다. 줄이려면 `self-start`.
   */
  className?: string;
}

export function ActionButton({
  size = "medium",
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  children,
  accessibilityLabel,
  ...props
}: ActionButtonProps) {
  // 텍스트성 children 은 ActionButton.Text 가 접근성 이름을 제공한다. 아이콘만 조립하면
  // 호출부가 accessibilityLabel 을 넘겨야 이름이 생긴다.
  const resolvedLabel =
    accessibilityLabel ??
    (isTextLikeChildren(children)
      ? Array.isArray(children)
        ? children.join("")
        : String(children)
      : undefined);

  return (
    <StyleContext.Provider value={{ size, variant }}>
      <Button
        isLoading={isLoading}
        disabled={disabled}
        accessibilityLabel={resolvedLabel}
        // 상태 의존 배경은 코어 상태로 스킨이 계산한다(className 리졸버).
        className={(state) =>
          containerStyles({
            size,
            variant,
            isActive: state.isPressed || state.isLoading,
            isDisabled: state.disabled,
            class: className,
          })
        }
        {...props}
      >
        {/* destructive 눌림 오버레이 — content 보다 먼저 와야 뒤에 깔린다. */}
        <PressOverlay />

        {/* 로딩 중에도 자리를 차지해야 폭이 유지된다 — 언마운트하지 않고 opacity-0. */}
        <View className={isLoading ? "opacity-0" : undefined}>
          {isTextLikeChildren(children) ? (
            <ActionButtonText>{children}</ActionButtonText>
          ) : (
            children
          )}
        </View>

        {isLoading && <SpinnerOverlay />}
      </Button>
    </StyleContext.Provider>
  );
}

function PressOverlay() {
  const { variant } = useActionButtonStyle();
  const { isPressed, isLoading, disabled } = useButtonState();
  const isActive = isPressed || isLoading;
  if (variant !== "destructive" || !isActive || disabled) {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 bg-opacity-white-10"
    />
  );
}

function SpinnerOverlay() {
  const { size, variant } = useActionButtonStyle();
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
    >
      {/* 버튼 size(small|medium)는 Spinner size 의 부분집합이라 그대로 넘긴다. */}
      <Spinner
        size={size}
        tone={variant === "primary" ? "on-light" : "on-dark"}
      />
    </View>
  );
}

function ActionButtonText({ children }: { children: TextLikeChildren }) {
  const { variant } = useActionButtonStyle();
  const { disabled } = useButtonState();
  return (
    <Text
      variant="heading-3-medium"
      className={labelColorStyles({ variant, isDimmed: disabled })}
    >
      {children}
    </Text>
  );
}

ActionButton.Text = ActionButtonText;
