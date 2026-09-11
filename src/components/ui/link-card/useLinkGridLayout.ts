import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useWindowDimensions } from "react-native";

import { CONTENT_MAX_WIDTH } from "@/constants/layout.constants";

import { getLinkGridLayout, type LinkGridLayout } from "./link-grid.utils";

// 그리드는 화면 좌우 패딩(20) 안에 놓인다 — 측정 전 첫 페인트 추정에만 쓴다.
const SCREEN_HORIZONTAL_PADDING = 20 * 2;

interface UseLinkGridLayoutOptions {
  /** 측정하는 요소가 좌우 패딩을 포함하면(FlatList contentContainerStyle 등) 그만큼 뺀다. */
  horizontalPadding?: number;
}

interface UseLinkGridLayoutResult extends LinkGridLayout {
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * 그리드 컨테이너 폭에 맞는 열 수·카드 폭.
 * 첫 페인트는 창 폭(콘텐츠 최대 폭으로 클램프)으로 추정하고 onLayout 이 실제 폭으로 보정한다.
 */
export function useLinkGridLayout({
  horizontalPadding = 0,
}: UseLinkGridLayoutOptions = {}): UseLinkGridLayoutResult {
  const { width: windowWidth } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(
    Math.min(windowWidth, CONTENT_MAX_WIDTH) - SCREEN_HORIZONTAL_PADDING,
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setContentWidth(event.nativeEvent.layout.width - horizontalPadding);
  };

  return { ...getLinkGridLayout(contentWidth), onLayout };
}
