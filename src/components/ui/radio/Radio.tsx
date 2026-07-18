import { Check } from "lucide-react-native";
import { createContext, useContext } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { Text, type TextProps } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

interface RadioGroupContextValue {
  value: string | null;
  onChange: (value: string) => void;
}
const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

interface RadioContextValue {
  checked: boolean;
}
const RadioContext = createContext<RadioContextValue | null>(null);

function useRadioGroup() {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error("Radio 는 RadioGroup 안에서만 사용할 수 있습니다");
  }
  return ctx;
}

function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) {
    throw new Error(
      "RadioIndicator·RadioIcon·RadioLabel 은 Radio 안에서만 사용할 수 있습니다",
    );
  }
  return ctx;
}

export interface RadioGroupProps {
  value: string | null;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({
  value,
  onChange,
  children,
  className,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onChange }}>
      <View accessibilityRole="radiogroup" className={className}>
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps {
  value: string;
  children: React.ReactNode;
}

export function Radio({ value, children }: RadioProps) {
  const group = useRadioGroup();
  const checked = group.value === value;

  return (
    <RadioContext.Provider value={{ checked }}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked }}
        onPress={() => group.onChange(value)}
        className="h-11 flex-row items-center gap-2"
      >
        {children}
      </Pressable>
    </RadioContext.Provider>
  );
}

// Figma save-sheet 라디오 스펙(21px · 1.5px #404040 · 선택 시 accent 채움 + 체크).
// 미선택 테두리의 mix-blend-plus-lighter 는 RN 미지원이라 색만 반영한다.
const indicatorStyles = tv({
  base: "size-[21px] items-center justify-center rounded-full",
  variants: {
    checked: {
      true: "bg-icon-accent",
      false: "border-[1.5px] border-[#404040]",
    },
  },
});

export interface RadioIndicatorProps {
  children?: React.ReactNode;
}

export function RadioIndicator({ children }: RadioIndicatorProps) {
  const { checked } = useRadio();

  return <View className={indicatorStyles({ checked })}>{children}</View>;
}

export function RadioIcon() {
  const { checked } = useRadio();
  if (!checked) {
    return null;
  }
  return (
    <Icon
      iconNode={Check}
      size={12}
      strokeWidth={3}
      className="text-icon-strong"
    />
  );
}

// RadioLabel 은 Text 를 감싸므로 TextProps 를 그대로 연장 — variant·className 등 오버라이드 가능.
export type RadioLabelProps = TextProps;

export function RadioLabel({
  variant = "body-2-normal",
  ...props
}: RadioLabelProps) {
  return <Text variant={variant} {...props} />;
}
