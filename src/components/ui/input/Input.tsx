import type { PressableProps, TextInputProps, ViewProps } from "react-native";
import { Pressable, TextInput, View } from "react-native";

import { isAndroid } from "@/constants/platform.constants";
import { tv } from "@/lib/tv";

// gluestack v2 Input 의 compound 구조(Input/InputSlot/InputField)를 차용해
// 우리 스택(tv + 디자인 토큰)으로 작성. focus 상태 스타일은 디자인 확정 시 추가한다.
export const inputStyles = tv({
  base: "flex-row items-center bg-background-input",
  variants: {
    variant: {
      pill: "h-10 flex-1 rounded-full px-3",
      field: "min-h-13 w-full rounded-2xl px-4 py-3",
    },
  },
});

const inputSlotStyles = tv({
  base: "items-center justify-center",
});

// 웹은 브라우저 기본 포커스 아웃라인이 pill 안에 그려져 제거한다 (포커스 표시는 디자인 확정 시 추가).
// iOS TextInput 은 lineHeight(text-base 의 24)가 폰트보다 크면 글리프를 라인박스
// 하단에 정렬해 텍스트가 ~2pt 내려간다 — line-height 를 해제해 자연 중앙 정렬시킨다.
const inputFieldStyles = tv({
  base: "flex-1 font-pretendard-medium text-base text-text-strong web:outline-none ios:leading-[0px]",
});

// placeholder·커서 색은 RN 특성상 prop 으로만 지정 가능 — 토큰 값(text-assistive / white-100)
const PLACEHOLDER_COLOR = "#65656b";
const CURSOR_COLOR = "#ffffff";
// Android 는 selectionColor 를 하이라이트에 불투명하게 그대로 써서 흰 텍스트가
// 가려진다(실기 확인). iOS 는 시스템이 알파를 적용하므로 흰색 그대로 쓴다.
const SELECTION_COLOR = isAndroid ? "#ffffff4d" : "#ffffff";

export interface InputProps extends Omit<ViewProps, "className"> {
  className?: string;
  variant: "pill" | "field";
}

export function Input({ className, variant, ...props }: InputProps) {
  return (
    <View className={inputStyles({ variant, class: className })} {...props} />
  );
}

export interface InputSlotProps extends Omit<PressableProps, "className"> {
  className?: string;
}

export function InputSlot({ className, ...props }: InputSlotProps) {
  return (
    <Pressable className={inputSlotStyles({ class: className })} {...props} />
  );
}

export interface InputFieldProps extends Omit<TextInputProps, "className"> {
  className?: string;
}

export function InputField({ className, ...props }: InputFieldProps) {
  return (
    <TextInput
      placeholderTextColor={PLACEHOLDER_COLOR}
      cursorColor={CURSOR_COLOR}
      selectionColor={SELECTION_COLOR}
      className={inputFieldStyles({ class: className })}
      {...props}
    />
  );
}
