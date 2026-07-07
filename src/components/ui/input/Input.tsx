import type { PressableProps, TextInputProps, ViewProps } from "react-native";
import { Pressable, TextInput, View } from "react-native";

import { tv } from "@/lib/tv";

// gluestack v2 Input 의 compound 구조(Input/InputSlot/InputField)를 차용해
// 우리 스택(tv + 디자인 토큰)으로 작성. focus 상태 스타일은 디자인 확정 시 추가한다.
const inputStyles = tv({
  base: "h-10 flex-1 flex-row items-center rounded-full bg-background-input px-3",
});

const inputSlotStyles = tv({
  base: "items-center justify-center",
});

const inputFieldStyles = tv({
  base: "flex-1 font-pretendard-medium text-base text-text-strong",
});

// placeholder 색은 RN 특성상 prop 으로만 지정 가능 — text-assistive(gray-400) 토큰 값
const PLACEHOLDER_COLOR = "#65656b";

export interface InputProps extends Omit<ViewProps, "className"> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return <View className={inputStyles({ class: className })} {...props} />;
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
      className={inputFieldStyles({ class: className })}
      {...props}
    />
  );
}
