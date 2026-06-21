import { H1, H2, H3, H4, H5, H6 } from "@expo/html-elements";
import { tv, type VariantProps } from "tailwind-variants";

const headingStyles = tv({
  base: "font-bold text-neutral-900",
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
    sub: {
      true: "text-xs",
    },
    italic: {
      true: "italic",
    },
    highlight: {
      true: "bg-yellow-500",
    },
    size: {
      xs: "text-sm",
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
      "2xl": "text-3xl",
      "3xl": "text-4xl",
      "4xl": "text-5xl",
      "5xl": "text-6xl",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

type RNHeadingProps = React.ComponentProps<typeof H1>;
type HeadingSize = NonNullable<VariantProps<typeof headingStyles>["size"]>;

const ariaLevelBySize: Record<HeadingSize, 1 | 2 | 3 | 4 | 5 | 6> = {
  "5xl": 1,
  "4xl": 1,
  "3xl": 1,
  "2xl": 2,
  xl: 3,
  lg: 4,
  md: 5,
  sm: 6,
  xs: 6,
};

export interface HeadingProps
  extends Omit<RNHeadingProps, "className" | "aria-level">,
    VariantProps<typeof headingStyles> {
  className?: string;
}

export function Heading({
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
}: HeadingProps) {
  const resolvedSize: HeadingSize = size ?? "lg";
  const ariaLevel = ariaLevelBySize[resolvedSize];
  const styles = headingStyles({
    isTruncated,
    bold,
    underline,
    strikeThrough,
    size,
    sub,
    italic,
    highlight,
    class: className,
  });

  switch (resolvedSize) {
    case "5xl":
    case "4xl":
    case "3xl":
      return <H1 aria-level={ariaLevel} {...props} className={styles} />;
    case "2xl":
      return <H2 aria-level={ariaLevel} {...props} className={styles} />;
    case "xl":
      return <H3 aria-level={ariaLevel} {...props} className={styles} />;
    case "lg":
      return <H4 aria-level={ariaLevel} {...props} className={styles} />;
    case "md":
      return <H5 aria-level={ariaLevel} {...props} className={styles} />;
    case "sm":
    case "xs":
      return <H6 aria-level={ariaLevel} {...props} className={styles} />;
  }
}
