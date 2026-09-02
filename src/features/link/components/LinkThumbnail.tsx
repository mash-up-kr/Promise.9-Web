import { Image, type ImageLoadEventData } from "expo-image";
import { ExternalLink } from "lucide-react-native";
import { useState } from "react";
import {
  type LayoutChangeEvent,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { GlassView } from "@/components/ui/glass-view/GlassView";
import { Icon } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

// 페이지 인디케이터 닷 — 현재 페이지만 불투명(100), 나머지는 30%.
const indicatorDot = tv({
  base: "size-[5px] rounded-full",
  variants: {
    active: {
      true: "bg-opacity-white-100",
      false: "bg-opacity-white-30",
    },
  },
});

// 대표 이미지는 원본 비율을 따른다: 가로형은 부모 컨테이너 가로폭 100%(좌우 패딩은
// 상위에서 처리), 세로형은 240 고정.
const PORTRAIT_WIDTH = 240;
// 로드 전 기본 비율(가로형 Figma 335×235 기준) — og-image 대부분 landscape.
const DEFAULT_ASPECT_RATIO = 335 / 235;
// 플레이스홀더 박스 비율(Figma no-thumbnail 335×200).
const PLACEHOLDER_ASPECT_RATIO = 335 / 200;
const PLACEHOLDER_ICON_SIZE = 72;
const BLUR_RADIUS = 2.4;
// 썸네일 없음 플레이스홀더 일러스트(투명 240×240) — Illustration 은 빈상태/에러 전용이라 직접 require.
const PLACEHOLDER_SOURCE = require("@/assets/images/no-thumbnail.png");

export interface LinkThumbnailProps {
  /** 대표 이미지들. 0장이면 플레이스홀더, 1장이면 단일, 2장 이상이면 캐러셀. */
  imageUrls: string[];
  url: string;
}

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    // 링크 열기 실패 — 개발 로깅만. 사용자 노출 메시지는 이번 스코프 밖.
    console.warn("링크를 열지 못했습니다", error);
  }
}

// 우하단 원문 이동(↗) 버튼 — 플레이스홀더·단일·캐러셀 공통.
function OpenOriginalButton({ url }: { url: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="링크 열기"
      onPress={() => openUrl(url)}
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
  );
}

export function LinkThumbnail({ imageUrls, url }: LinkThumbnailProps) {
  if (imageUrls.length === 0) {
    return <ThumbnailPlaceholder url={url} />;
  }
  if (imageUrls.length === 1) {
    return <SingleThumbnail imageUrl={imageUrls[0]} url={url} />;
  }
  return <ThumbnailCarousel imageUrls={imageUrls} url={url} />;
}

// 썸네일 없음 — 어두운 박스 가운데 일러스트 + 원문 이동 버튼.
function ThumbnailPlaceholder({ url }: { url: string }) {
  return (
    <View
      className="w-full items-center justify-center self-center overflow-hidden rounded-[20px] bg-background-thumbnail"
      style={{ aspectRatio: PLACEHOLDER_ASPECT_RATIO }}
    >
      <Image
        testID="thumb-placeholder"
        source={PLACEHOLDER_SOURCE}
        contentFit="contain"
        style={{ width: PLACEHOLDER_ICON_SIZE, height: PLACEHOLDER_ICON_SIZE }}
      />
      <OpenOriginalButton url={url} />
    </View>
  );
}

// 단일 이미지 — 로드 후 실제 치수로 가로/세로형 판정(세로형은 흐린 배경으로 여백을 메운다).
function SingleThumbnail({ imageUrl, url }: { imageUrl: string; url: string }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  function handleLoad({ source }: ImageLoadEventData) {
    setSize({ width: source.width, height: source.height });
  }

  const isPortrait = size != null && size.height > size.width;
  const boxWidth: number | `${number}%` = isPortrait ? PORTRAIT_WIDTH : "100%";
  const aspectRatio =
    size != null ? size.width / size.height : DEFAULT_ASPECT_RATIO;

  return (
    <View
      className="self-center overflow-hidden rounded-[20px] bg-background-thumbnail"
      style={{ width: boxWidth, aspectRatio }}
    >
      {/* 세로형: 같은 이미지를 흐리게 깔아 배경을 메운다 (Figma 30:899, blur 2.4 · opacity 0.5) */}
      {isPortrait && (
        <Image
          testID="thumb-blur"
          source={{ uri: imageUrl }}
          contentFit="cover"
          blurRadius={BLUR_RADIUS}
          style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
        />
      )}

      {/* 전경: 원본 이미지. 로드 완료 시 실제 치수를 받아 세로/가로 판정에 쓴다. */}
      <Image
        testID="thumb-image"
        source={{ uri: imageUrl }}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        onLoad={handleLoad}
      />

      <OpenOriginalButton url={url} />
    </View>
  );
}

// 여러 장 — 가로 페이징 캐러셀 + 하단 페이지 인디케이터.
function ThumbnailCarousel({
  imageUrls,
  url,
}: {
  imageUrls: string[];
  url: string;
}) {
  const [page, setPage] = useState(0);
  // 초기 폭을 화면 폭으로 추정해 첫 페인트의 width:0 깜빡임을 없앤다. onLayout 이 실제 폭으로 보정한다.
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(windowWidth);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    if (layoutMeasurement.width > 0) {
      setPage(Math.round(contentOffset.x / layoutMeasurement.width));
    }
  };

  return (
    <View className="w-full self-center">
      <View
        onLayout={handleLayout}
        className="overflow-hidden rounded-[20px] bg-background-thumbnail"
        style={{ aspectRatio: DEFAULT_ASPECT_RATIO }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
        >
          {imageUrls.map((uri) => (
            <Image
              key={uri}
              testID="thumb-image"
              source={{ uri }}
              contentFit="cover"
              style={{ width, height: "100%" }}
            />
          ))}
        </ScrollView>
        <OpenOriginalButton url={url} />
      </View>

      {/* 페이지 인디케이터 (Figma no-thumbnail Indicators, 5px 닷) */}
      <View className="mt-2 flex-row justify-center gap-1.5">
        {imageUrls.map((uri, index) => (
          <View
            key={uri}
            testID="thumb-indicator"
            className={indicatorDot({ active: index === page })}
          />
        ))}
      </View>
    </View>
  );
}
