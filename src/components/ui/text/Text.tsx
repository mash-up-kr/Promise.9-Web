import { Text as RNText } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const textStyles = tv({
  base: "text-neutral-700",
  variants: {
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
  defaultVariants: {
    size: "md",
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
  return (
    <RNText
      className={textStyles({
        isTruncated,
        bold,
        underline,
        strikeThrough,
        size,
        sub,
        italic,
        highlight,
        class: className,
      })}
      {...props}
    />
  );
}
