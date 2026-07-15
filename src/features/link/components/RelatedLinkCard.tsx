import type { Link } from "@shared/types/link.types";
import { useEffect, useState } from "react";
import { Image, Platform, View } from "react-native";
import { Text } from "@/components/ui/text/Text";

// landscape 예시가 Figma 에 없어 임시로 잡은 반경 — dev-preview 실측 후 조정.
const BLUR_RADIUS = 12;

export interface RelatedLinkCardProps {
  link: Link;
}

export function RelatedLinkCard({ link }: RelatedLinkCardProps) {
  // 원본 이미지의 실제 치수를 알아야 landscape 여부를 판정할 수 있다(URL만으론 알 수 없음).
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Image.getSize(
      link.thumbnailUrl,
      (width, height) => {
        if (!cancelled) setIsLandscape(width > height);
      },
      () => {
        // 측정 실패 시 기본값(세로형, false)을 유지한다.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [link.thumbnailUrl]);

  return (
    <View className="w-[120px] shrink-0 gap-2">
      {/* TODO: 카드 탭 시 해당 링크 상세(/link/[id])로 이동 — 백엔드/네비게이션 연동 후속 이슈에서 처리 */}
      <View className="h-[150px] w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-background-thumbnail">
        {isLandscape && (
          <Image
            testID="related-thumb-blur"
            source={{ uri: link.thumbnailUrl }}
            resizeMode="cover"
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                transform: [{ scale: 1.1 }],
              },
              Platform.OS === "web"
                ? { filter: `blur(${BLUR_RADIUS}px)` }
                : { filter: [{ blur: BLUR_RADIUS }] },
            ]}
          />
        )}
        <Image
          testID="related-thumb-image"
          source={{ uri: link.thumbnailUrl }}
          resizeMode={isLandscape ? "contain" : "cover"}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>
      <Text variant="body-4" className="w-[120px]">
        {link.title}
      </Text>
    </View>
  );
}
