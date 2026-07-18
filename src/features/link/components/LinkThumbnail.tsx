import { Image, type ImageLoadEventData } from "expo-image";
import { ExternalLink } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { GlassView } from "@/components/ui/glass-view/GlassView";
import { Icon } from "@/components/ui/icon/Icon";
import { ThumbnailFallback } from "@/components/ui/thumbnail/ThumbnailFallback";

// 대표 이미지는 원본 비율을 따른다: 가로형은 부모 컨테이너 가로폭 100%(좌우 패딩은
// 상위에서 처리), 세로형은 240 고정.
const PORTRAIT_WIDTH = 240;
// 로드 전 기본 비율(가로형 Figma 335×235 기준) — og-image 대부분 landscape.
const DEFAULT_ASPECT_RATIO = 335 / 235;
const BLUR_RADIUS = 2.4;

export interface LinkThumbnailProps {
  thumbnailUrl: string;
  // 원문 url 이 없는 링크(시드 일부)도 있어 nullable — 없으면 열기 버튼을 숨긴다.
  url: string | null;
}

export function LinkThumbnail({ thumbnailUrl, url }: LinkThumbnailProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [failed, setFailed] = useState(false);

  function handleLoad({ source }: ImageLoadEventData) {
    setSize({ width: source.width, height: source.height });
  }

  // 썸네일이 없거나(빈 문자열·null) 로드에 실패하면 Link 아이콘 폴백을 보여준다.
  const showFallback = failed || !thumbnailUrl;
  const isPortrait = size != null && size.height > size.width;
  const boxWidth: number | `${number}%` = isPortrait ? PORTRAIT_WIDTH : "100%";
  const aspectRatio =
    size != null ? size.width / size.height : DEFAULT_ASPECT_RATIO;

  async function handleOpen() {
    if (!url) return;
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
      {showFallback ? (
        <ThumbnailFallback
          testID="thumb-fallback"
          className="absolute inset-0"
          iconSize={40}
        />
      ) : (
        <>
          {/* 세로형: 같은 이미지를 흐리게 깔아 배경을 메운다 (Figma 30:899, blur 2.4 · opacity 0.5) */}
          {isPortrait && (
            <Image
              testID="thumb-blur"
              source={{ uri: thumbnailUrl }}
              contentFit="cover"
              blurRadius={BLUR_RADIUS}
              style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
            />
          )}

          {/* 전경: 원본 이미지. 로드 완료 시 실제 치수를 받아 세로/가로 판정에 쓴다. */}
          <Image
            testID="thumb-image"
            source={{ uri: thumbnailUrl }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            onLoad={handleLoad}
            onError={() => setFailed(true)}
          />
        </>
      )}

      {/* 우하단 원문 이동 버튼 — 원문 url 이 있을 때만 (없으면 열 대상이 없어 숨긴다) */}
      {url ? (
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
            <Icon
              iconNode={ExternalLink}
              size={16}
              className="text-icon-normal"
              strokeWidth={1.3}
            />
          </GlassView>
        </Pressable>
      ) : null}
    </View>
  );
}
