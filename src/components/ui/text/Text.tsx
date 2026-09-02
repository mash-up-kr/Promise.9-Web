import { Text as RNText } from "react-native";
import type { VariantProps } from "tailwind-variants";

import { tv } from "@/lib/tv";

// 네이티브는 폰트의 weight 축을 지원하지 않아 각 프리셋의 font-weight 만으로는
// 굵기가 반영되지 않는다. 프리셋별로 굵기에 맞는 static 폰트(font-pretendard-*)를 함께 지정한다.
const variantPresets = {
  title: "text-title font-pretendard-semibold",
  "heading-1": "text-heading-1 font-pretendard-semibold",
  "heading-2": "text-heading-2 font-pretendard-semibold",
  "heading-3": "text-heading-3 font-pretendard-semibold",
  "heading-3-medium": "text-heading-3-medium font-pretendard-medium",
  "body-1": "text-body-1 font-pretendard",
  "body-2-normal": "text-body-2-normal font-pretendard-medium",
  "body-2-reading": "text-body-2-reading font-pretendard",
  "body-3": "text-body-3 font-pretendard-medium",
  "body-4": "text-body-4 font-pretendard-medium",
  "label-1": "text-label-1 font-pretendard-semibold",
  "label-2-medium": "text-label-2-medium font-pretendard-medium",
  "label-2-semibold": "text-label-2-semibold font-pretendard-semibold",
  "caption-1": "text-caption-1 font-pretendard",
  "caption-2": "text-caption-2 font-pretendard",
  "caption-3": "text-caption-3 font-pretendard",
} as const;

const textStyles = tv({
  base: "font-pretendard text-text-normal",
  variants: {
    variant: variantPresets,
    isTruncated: {
      true: "web:truncate",
    },
    bold: {
      true: "font-pretendard-bold",
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

// iOS Share Extension 프로세스에서는 css interop 이 fontFamily 를 지정한 Text 를
// 폰트 값과 무관하게 그리지 못한다(등록 방식 불문 — Fabric 조합 버그로 추정).
// 익스텐션 엔트리(index.share.js)가 이 플래그를 세우면 폰트 클래스만 걷어내
// 시스템 폰트로 폴백한다(공유 익스텐션 통례). 메인 앱 경로에서는 no-op.
declare global {
  var __promise9ShareExtension: boolean | undefined;
}

function stripFontClasses(resolved: string): string {
  if (!globalThis.__promise9ShareExtension) {
    return resolved;
  }
  return resolved
    .split(" ")
    .filter((token) => !token.startsWith("font-pretendard"))
    .join(" ");
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
      className={stripFontClasses(
        textStyles({
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
        }),
      )}
      {...props}
    />
  );
}
