import type { RelatedLink } from "@shared/types/link.types";
import { Image, type ImageLoadEventData } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text/Text";
import { linkDetailHref } from "@/constants/routes.constants";

// landscape 예시가 Figma 에 없어 임시로 잡은 반경 — dev-preview 실측 후 조정.
const BLUR_RADIUS = 12;

export interface RelatedLinkCardProps {
  link: RelatedLink;
}

export function RelatedLinkCard({ link }: RelatedLinkCardProps) {
  const router = useRouter();
  // 원본 이미지의 실제 치수를 알아야 landscape 여부를 판정할 수 있다(URL만으론 알 수 없음).
  const [isLandscape, setIsLandscape] = useState(false);

  function handleLoad({ source }: ImageLoadEventData) {
    setIsLandscape(source.width > source.height);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${link.title} 링크 열기`}
      onPress={() => router.push(linkDetailHref(String(link.linkId)))}
      className="w-[120px] shrink-0 gap-2"
    >
      <View className="h-[150px] w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-background-thumbnail">
        {/* 썸네일이 없으면(서버가 빈 값) Image 를 그리지 않는다 — 빈 <img> 가 웹에서 테두리를 만든다. */}
        {link.thumbnailUrl ? (
          <>
            {isLandscape && (
              <Image
                testID="related-thumb-blur"
                source={{ uri: link.thumbnailUrl }}
                contentFit="cover"
                blurRadius={BLUR_RADIUS}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: [{ scale: 1.1 }],
                }}
              />
            )}
            <Image
              testID="related-thumb-image"
              source={{ uri: link.thumbnailUrl }}
              contentFit={isLandscape ? "contain" : "cover"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onLoad={handleLoad}
            />
          </>
        ) : null}
      </View>
      <Text variant="body-4" className="w-[120px]">
        {link.title}
      </Text>
    </Pressable>
  );
}
