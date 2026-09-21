import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { Pressable, type PressableProps } from "react-native";

// 헤드리스(unstyled) 버튼 코어 — "동작·구조"만 소유하고 "생김새"는 모른다.
// 색·variant·size 는 이 위에 얹는 스킨(ActionButton·SocialButton 등)이 소유한다.
// (설계 배경: plan/action-button-refactor-plan.md — 헤드리스 코어 + 스킨)

export interface ButtonState {
  /** onPressIn~onPressOut 사이 */
  isPressed: boolean;
  isLoading: boolean;
  /** disabled prop 원본(=Loading 제외한 "죽은 회색" 판단의 출처) */
  disabled: boolean;
}

// className 은 정적 문자열이거나, 상태를 받아 문자열을 만드는 리졸버다.
// pressed/disabled 처럼 상태에 따라 바뀌는 배경을 "스킨이" 계산하게 해준다.
// (상태는 코어 안에 있고 매핑은 스킨에 있는 문제를 푸는 React Aria 방식.)
export type ButtonClassName = string | ((state: ButtonState) => string);

const ButtonStateContext = createContext<ButtonState | null>(null);

/** 코어 상태(press/loading/disabled)를 슬롯·오버레이가 읽는다. <Button> 밖에서는 던진다. */
export function useButtonState(): ButtonState {
  const state = useContext(ButtonStateContext);
  if (!state) {
    throw new Error("useButtonState 는 <Button> 안에서만 쓸 수 있습니다.");
  }
  return state;
}

export interface ButtonProps
  extends PropsWithChildren<Omit<PressableProps, "style" | "className">> {
  /** press 를 막고(=disabled 취급) busy 를 노출한다. 스피너 표시는 스킨이 담당. */
  isLoading?: boolean;
  className?: ButtonClassName;
}

export function Button({
  isLoading = false,
  disabled,
  className,
  children,
  onPressIn,
  onPressOut,
  accessibilityRole = "button",
  accessibilityState,
  ...props
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const state: ButtonState = {
    isPressed,
    isLoading,
    disabled: Boolean(disabled),
  };
  // "누를 수 없음" = disabled 이거나 loading.
  const isBlocked = Boolean(disabled) || isLoading;
  const resolvedClassName =
    typeof className === "function" ? className(state) : className;

  return (
    <ButtonStateContext.Provider value={state}>
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityState={{
          ...accessibilityState,
          disabled: isBlocked,
          busy: isLoading,
        }}
        disabled={isBlocked}
        onPressIn={(event) => {
          setIsPressed(true);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          setIsPressed(false);
          onPressOut?.(event);
        }}
        className={resolvedClassName}
        {...props}
      >
        {children}
      </Pressable>
    </ButtonStateContext.Provider>
  );
}
