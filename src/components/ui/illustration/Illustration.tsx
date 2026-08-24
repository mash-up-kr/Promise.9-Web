import { Image } from "expo-image";

// 캐릭터가 벡터가 아니라 비트맵이라 말풍선·아이콘까지 포함한 통짜 이미지를 상태별로 둔다.
// 배경은 투명(리뷰 반영) — 확장자 없는 require 로 RN 이 @2x·@3x 를 밀도에 맞게 고른다.
const SOURCES = {
  "empty-link": require("@/assets/images/illustration/empty-link.png"),
  error: require("@/assets/images/illustration/error.png"),
};

export type IllustrationName = keyof typeof SOURCES;

export interface IllustrationProps {
  name: IllustrationName;
  /** 시안 기본 200. 섹션 안에 들어갈 땐 줄여 쓴다. */
  size?: number;
  /** 그림이 문구 이상의 정보를 줄 때만 넘긴다 — 없으면 스크린리더가 건너뛴다. */
  accessibilityLabel?: string;
}

/** 빈 상태·에러 화면의 그래픽. `EmptyState` 의 illustration 슬롯에 넣는다. */
export function Illustration({
  name,
  size = 200,
  accessibilityLabel,
}: IllustrationProps) {
  return (
    <Image
      testID={`illustration-${name}`}
      accessibilityLabel={accessibilityLabel}
      source={SOURCES[name]}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
