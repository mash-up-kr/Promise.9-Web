import { Image } from "expo-image";

// 캐릭터가 벡터가 아니라 비트맵이고 Figma export 에 배경(background-base)이 함께 구워지므로,
// 말풍선·아이콘까지 포함한 통짜 이미지를 상태별로 둔다. 다크 고정 화면이라 배경은 드러나지 않는다.
const SOURCES = {
  "empty-link": require("@/assets/images/illustration/empty-link.png"),
  error: require("@/assets/images/illustration/error.png"),
};

export type IllustrationName = keyof typeof SOURCES;

export interface IllustrationProps {
  name: IllustrationName;
  /** 시안 기본 200. 섹션 안에 들어갈 땐 줄여 쓴다. */
  size?: number;
}

/** 빈 상태·에러 화면의 그래픽. `EmptyState` 의 illustration 슬롯에 넣는다. */
export function Illustration({ name, size = 200 }: IllustrationProps) {
  return (
    <Image
      testID={`illustration-${name}`}
      source={SOURCES[name]}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
