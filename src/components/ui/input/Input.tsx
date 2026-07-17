import { createContext, useContext } from "react";
import type { PressableProps, TextInputProps, ViewProps } from "react-native";
import { Platform, Pressable, TextInput, View } from "react-native";

import { tv } from "@/lib/tv";

type InputVariant = "pill" | "field";

// gluestack v2 Input 의 compound 구조(Input/InputSlot/InputField)를 차용해
// 우리 스택(tv + 디자인 토큰)으로 작성. 타입별 스타일(폰트·placeholder 색)은
// Input 이 context 로 InputField 에 내려준다 — 호출부는 variant 를 한 번만 지정한다.
const InputVariantContext = createContext<InputVariant>("field");

// pill=Search, field=Default (Figma Input 타입). 배경·radius·padding 이 타입마다 다르다.
export const inputStyles = tv({
  base: "flex-row items-center",
  variants: {
    variant: {
      pill: "h-10 flex-1 rounded-full bg-background-input px-3",
      field: "min-h-13 w-full rounded-[20px] bg-opacity-white-10 p-4",
    },
  },
});

const inputSlotStyles = tv({
  base: "items-center justify-center",
});

// 채움 텍스트 색은 두 타입 모두 text/normal, 폰트만 타입별로 다르다
// (Default=Pretendard Regular 14 / Search=Pretendard Medium 16).
// iOS TextInput 은 lineHeight 가 폰트보다 크면 글리프를 라인박스 하단에 정렬해
// 텍스트가 내려간다 — line-height 를 해제해 자연 중앙 정렬시킨다.
// 웹은 브라우저 기본 포커스 아웃라인을 제거한다.
export const inputFieldStyles = tv({
  base: "flex-1 text-text-normal web:outline-none ios:leading-[0px]",
  variants: {
    variant: {
      field: "font-pretendard text-body-2-reading",
      pill: "font-pretendard-medium text-heading-3 tracking-[-0.16px]",
    },
  },
});

// placeholder·커서·선택 색은 RN 특성상 prop 으로만 지정 가능.
// placeholder 색이 타입마다 다르다 (Default=white-30 / Search=gray-400).
const PLACEHOLDER_COLOR: Record<InputVariant, string> = {
  field: "#ffffff4d", // opacity-white-30
  pill: "#65656b", // gray-400 (text-assistive)
};
const CURSOR_COLOR = "#ffffff";
// Android 는 selectionColor 를 하이라이트에 불투명하게 그대로 써서 흰 텍스트가
// 가려진다(실기 확인). iOS 는 시스템이 알파를 적용하므로 흰색 그대로 쓴다.
const SELECTION_COLOR = Platform.OS === "android" ? "#ffffff4d" : "#ffffff";

export interface InputProps extends Omit<ViewProps, "className"> {
  className?: string;
  variant: InputVariant;
}

export function Input({ className, variant, ...props }: InputProps) {
  return (
    <InputVariantContext.Provider value={variant}>
      <View className={inputStyles({ variant, class: className })} {...props} />
    </InputVariantContext.Provider>
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
  const variant = useContext(InputVariantContext);
  return (
    <TextInput
      placeholderTextColor={PLACEHOLDER_COLOR[variant]}
      cursorColor={CURSOR_COLOR}
      selectionColor={SELECTION_COLOR}
      className={inputFieldStyles({ variant, class: className })}
      {...props}
    />
  );
}
