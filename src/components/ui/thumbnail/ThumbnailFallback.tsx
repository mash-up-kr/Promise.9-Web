import type { ViewProps } from "react-native";

import { Box } from "@/components/ui/box/Box";
import { Image } from "@/components/ui/image/Image";
import { tv } from "@/lib/tv";

// 썸네일 없음 일러스트(투명 240×240) — 링크 상세 LinkThumbnail 과 같은 에셋.
const SOURCE = require("@/assets/images/no-thumbnail.png");

const fallbackStyles = tv({
  base: "items-center justify-center overflow-hidden bg-background-thumbnail",
});

export interface ThumbnailFallbackProps extends Omit<ViewProps, "className"> {
  className?: string;
}

/**
 * 썸네일이 없거나 못 불러왔을 때의 자리(Figma Image Placeholder).
 * 크기·모서리는 호출부가 className·style 로 준다.
 */
export function ThumbnailFallback({
  className,
  ...props
}: ThumbnailFallbackProps) {
  return (
    <Box className={fallbackStyles({ class: className })} {...props}>
      {/* 구름 일러스트를 박스 폭 75% 정사각으로 중앙 배치. */}
      <Image
        testID="thumbnail-fallback-image"
        source={SOURCE}
        contentFit="contain"
        className="aspect-square w-3/4"
      />
    </Box>
  );
}
