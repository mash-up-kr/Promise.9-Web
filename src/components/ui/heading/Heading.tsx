import { H1, H2, H3, H4, H5, H6 } from "@expo/html-elements";
import { styled } from "nativewind";
import type { VariantProps } from "tailwind-variants";

import { SwitchCase } from "@/components/ui/switch-case/SwitchCase";
import { tv } from "@/lib/tv";

// @expo/html-elements 의 H1~H6 은 fontWeight/fontSize 등 기본값을 inline `style` 로 주입한다.
// 네이티브에선 inline style 이 className 보다 우선하므로, styled 로 className 을 `style` 슬롯에
// 매핑해 H 내부의 `style={[기본값, props.style]}` 마지막 자리에서 기본값을 덮도록 한다.
const styledHeadingMapping = { className: "style" } as const;
const StyledH1 = styled(H1, styledHeadingMapping);
const StyledH2 = styled(H2, styledHeadingMapping);
const StyledH3 = styled(H3, styledHeadingMapping);
const StyledH4 = styled(H4, styledHeadingMapping);
const StyledH5 = styled(H5, styledHeadingMapping);
const StyledH6 = styled(H6, styledHeadingMapping);

export const headingStyles = tv({
  // 네이티브는 폰트의 weight 축을 지원하지 않아 title 프리셋의 font-weight(600)만으로는
  // 굵기가 바뀌지 않는다. weight 에 맞는 static 폰트(font-pretendard-semibold)를 함께 지정한다.
  base: "m-0 font-pretendard-semibold text-text-strong text-title",
  variants: {
    isTruncated: {
      true: "web:truncate",
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
  underline,
  strikeThrough,
  size,
  sub,
  italic,
  highlight,
  ...props
}: HeadingProps) {
  const resolvedSize: HeadingSize = size ?? "5xl";
  const ariaLevel = ariaLevelBySize[resolvedSize];
  const styles = headingStyles({
    isTruncated,
    underline,
    strikeThrough,
    size,
    sub,
    italic,
    highlight,
    class: className,
  });
  const renderAs = (Tag: React.ElementType) => () => (
    <Tag aria-level={ariaLevel} {...props} className={styles} />
  );

  return (
    <SwitchCase
      value={resolvedSize}
      caseBy={{
        "5xl": renderAs(StyledH1),
        "4xl": renderAs(StyledH1),
        "3xl": renderAs(StyledH1),
        "2xl": renderAs(StyledH2),
        xl: renderAs(StyledH3),
        lg: renderAs(StyledH4),
        md: renderAs(StyledH5),
        sm: renderAs(StyledH6),
        xs: renderAs(StyledH6),
      }}
    />
  );
}
