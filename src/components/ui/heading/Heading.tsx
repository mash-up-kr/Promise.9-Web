import { H1, H2, H3, H4, H5, H6 } from "@expo/html-elements";
import { tv, type VariantProps } from "tailwind-variants";

import { SwitchCase } from "@/components/ui/switch-case/SwitchCase";

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
  const renderAs = (Tag: typeof H1) => () => (
    <Tag aria-level={ariaLevel} {...props} className={styles} />
  );

  return (
    <SwitchCase
      value={resolvedSize}
      caseBy={{
        "5xl": renderAs(H1),
        "4xl": renderAs(H1),
        "3xl": renderAs(H1),
        "2xl": renderAs(H2),
        xl: renderAs(H3),
        lg: renderAs(H4),
        md: renderAs(H5),
        sm: renderAs(H6),
        xs: renderAs(H6),
      }}
    />
  );
}
