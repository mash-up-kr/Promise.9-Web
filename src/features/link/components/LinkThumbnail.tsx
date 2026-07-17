import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { GlassView } from "@/components/ui/glass-view/GlassView";
import { ExternalLinkIcon } from "@/components/ui/icon/ExternalLinkIcon";

// 대표 이미지는 원본 비율을 따른다: 가로형은 부모 컨테이너 가로폭 100%(좌우 패딩은
// 상위에서 처리), 세로형은 240 고정.
const PORTRAIT_WIDTH = 240;
// 치수 측정 전 기본 비율(가로형 Figma 335×235 기준) — og-image 대부분 landscape.
const DEFAULT_ASPECT_RATIO = 335 / 235;

export interface LinkThumbnailProps {
  thumbnailUrl: string;
  url: string;
}

export function LinkThumbnail({ thumbnailUrl, url }: LinkThumbnailProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    Image.getSize(
      thumbnailUrl,
      (width, height) => {
        if (!cancelled) setSize({ width, height });
      },
      () => {
        // 측정 실패 시 가로형 fallback 유지 — 사용자 노출 메시지는 불필요.
        if (!cancelled) setSize(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [thumbnailUrl]);

  const isPortrait = size != null && size.height > size.width;
  const boxWidth: number | `${number}%` = isPortrait ? PORTRAIT_WIDTH : "100%";
  const aspectRatio =
    size != null ? size.width / size.height : DEFAULT_ASPECT_RATIO;

  async function handleOpen() {
    try {
      await Linking.openURL(url);
    } catch (error) {
      // 링크 열기 실패 — 개발 로깅만. 사용자 노출 메시지는 이번 스코프 밖.
      console.warn("링크를 열지 못했습니다", error);
    }
  }

  return (
    <View
      className="self-center overflow-hidden rounded-[20px] bg-background-thumbnail"
      style={{ width: boxWidth, aspectRatio }}
    >
      {/* 세로형: 같은 이미지를 흐리게 깔아 배경을 메운다 (Figma 30:899, blur 2.4 · opacity 0.5) */}
      {isPortrait && (
        <Image
          testID="thumb-blur"
          source={{ uri: thumbnailUrl }}
          resizeMode="cover"
          style={[
            StyleSheet.absoluteFill,
            { opacity: 0.5 },
            Platform.OS === "web"
              ? { filter: "blur(2.4px)" }
              : { filter: [{ blur: 2.4 }] },
          ]}
        />
      )}

      {/* 전경: 원본 이미지 */}
      <Image
        testID="thumb-image"
        source={{ uri: thumbnailUrl }}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />

      {/* 우하단 원문 이동 버튼 (이미지 크기와 무관하게 항상 16px inset) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="링크 열기"
        onPress={handleOpen}
        className="absolute right-4 bottom-4 size-9 overflow-hidden rounded-full"
      >
        {/* 아이콘은 GlassView 의 자식으로 — 웹에서 svg 가 유리 레이어에 가리지 않게. */}
        <GlassView
          intensity={55}
          className="size-full items-center justify-center"
        >
          <ExternalLinkIcon />
        </GlassView>
      </Pressable>
    </View>
  );
}
