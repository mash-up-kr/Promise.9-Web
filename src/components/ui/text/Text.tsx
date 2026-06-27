import { Text as RNText } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const variantPresets = {
  title: "text-title",
  "heading-1": "text-heading-1",
  "heading-2": "text-heading-2",
  "heading-3": "text-heading-3",
  "body-1": "text-body-1",
  "body-2": "text-body-2",
  "body-3": "text-body-3",
  "body-4": "text-body-4",
  "label-1": "text-label-1",
  "label-2-medium": "text-label-2-medium",
  "label-2-semibold": "text-label-2-semibold",
  "caption-1": "text-caption-1",
  "caption-2": "text-caption-2",
} as const;

const textStyles = tv({
  base: "font-pretendard text-text-normal",
  variants: {
    variant: variantPresets,
    isTruncated: {
      true: "web:truncate",
    },
    bold: {
      true: "font-bold",
    },
    underline: {
      true: "underline",
    },
    strikeThrough: {
      true: "line-through",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
      "6xl": "text-6xl",
    },
    sub: {
      true: "text-xs",
    },
    italic: {
      true: "italic",
    },
    highlight: {
      true: "bg-yellow-500",
    },
  },
});

type RNTextProps = React.ComponentProps<typeof RNText>;

export interface TextProps
  extends Omit<RNTextProps, "className">,
    VariantProps<typeof textStyles> {
  className?: string;
}

export function Text({
  className,
  variant,
  isTruncated,
  bold,
  underline,
  strikeThrough,
  size,
  sub,
  italic,
  highlight,
  ...props
}: TextProps) {
  const resolvedSize = size ?? (variant ? undefined : "md");
  return (
    <RNText
      className={textStyles({
        variant,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        size: resolvedSize,
        sub,
        italic,
        highlight,
        class: className,
      })}
      {...props}
    />
  );
}
