import { createContext, useContext } from "react";

import { Button, type ButtonProps } from "@/components/ui/button/Button";
import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";
import { tv } from "@/lib/tv";

export type ChipSize = "sm" | "md";
export type ChipVariant = "outline" | "solid";

// Figma `Chip`(최근 검색어) · `Chip / Keyword`(키워드). 시안 값 그대로이며,
// 높이·타이포·여백이 함께 움직이므로 size 가 한 묶음으로 소유한다.
export const chipStyles = tv({
  base: "flex-row items-center justify-center rounded-full px-3",
  variants: {
    size: {
      sm: "h-8",
      md: "h-[42px] gap-1",
    },
    variant: {
      outline: "border border-opacity-white-30",
      solid: "bg-opacity-white-20",
    },
  },
  defaultVariants: { size: "sm", variant: "outline" },
});

const LABEL_TEXT_VARIANT = { sm: "caption-1", md: "body-2-normal" } as const;
const LABEL_COLOR = {
  sm: "text-text-normal",
  md: "text-opacity-white-90",
} as const;

// 시안 높이. 최소 터치 타깃(44)에 모자란 만큼만 hitSlop 으로 채운다 — 렌더 크기는 시안 그대로다.
const CHIP_HEIGHT: Record<ChipSize, number> = { sm: 32, md: 42 };
const MIN_TOUCH_SIZE = 44;
const ICON_SIZE = 13;

function toHitSlop(size: ChipSize) {
  const padding = Math.max(
    0,
    Math.round((MIN_TOUCH_SIZE - CHIP_HEIGHT[size]) / 2),
  );
  return { top: padding, bottom: padding };
}

const SizeContext = createContext<ChipSize | null>(null);

function useChipSize(): ChipSize {
  const size = useContext(SizeContext);
  if (!size) {
    throw new Error("Chip.Text · Chip.Icon 은 <Chip> 안에서만 쓸 수 있습니다.");
  }
  return size;
}

export interface ChipProps
  extends Omit<ButtonProps, "className" | "isLoading"> {
  /** 기본 sm */
  size?: ChipSize;
  /** 기본 outline */
  variant?: ChipVariant;
  className?: string;
}

export function Chip({
  size = "sm",
  variant = "outline",
  className,
  children,
  accessibilityLabel,
  ...props
}: ChipProps) {
  const isTextLabel = typeof children === "string";

  return (
    <SizeContext.Provider value={size}>
      <Button
        accessibilityLabel={
          accessibilityLabel ?? (isTextLabel ? children : undefined)
        }
        hitSlop={toHitSlop(size)}
        className={chipStyles({ size, variant, class: className })}
        {...props}
      >
        {isTextLabel ? <ChipText>{children}</ChipText> : children}
      </Button>
    </SizeContext.Provider>
  );
}

function ChipText({ children }: { children: string }) {
  const size = useChipSize();
  return (
    <Text variant={LABEL_TEXT_VARIANT[size]} className={LABEL_COLOR[size]}>
      {children}
    </Text>
  );
}

function ChipIcon({ iconNode }: { iconNode: IconComponent }) {
  useChipSize();
  return (
    <Icon
      iconNode={iconNode}
      size={ICON_SIZE}
      className="text-opacity-white-60"
    />
  );
}

Chip.Text = ChipText;
Chip.Icon = ChipIcon;
