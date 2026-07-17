import { Image, View } from "react-native";

import { isWeb } from "@/constants/platform.constants";

export interface LinkBackgroundProps {
  thumbnailUrl: string;
  dominantColor?: string;
}

/**
 * link-detail 화면 전체를 덮는 3겹 동적 배경.
 * 부모가 `flex-1`일 때 `absolute inset-0` 으로 전체를 채우므로
 * 항상 첫 번째 자식으로 배치하고 컨텐츠를 그 뒤에 둔다.
 *
 * 레이어 구조 (아래 → 위):
 * 1. 베이스 #121212
 * 2. 블러된 썸네일 (opacity 10%, blur 20px) — blur bleed 방지를 위해 scale(1.1)
 * 3. 대표색 틴트 (opacity 5%)
 */
export function LinkBackground({
  thumbnailUrl,
  dominantColor,
}: LinkBackgroundProps) {
  return (
    <View className="absolute inset-0 overflow-hidden">
      {/* Layer 1: 베이스 */}
      <View className="absolute inset-0 bg-[#121212]" />

      {/* Layer 2: 블러 썸네일 */}
      <Image
        source={{ uri: thumbnailUrl }}
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            transform: [{ scale: 1.1 }],
          },
          isWeb ? { filter: "blur(20px)" } : { filter: [{ blur: 20 }] },
        ]}
        resizeMode="cover"
      />

      {/* Layer 3: 대표색 틴트 5% */}
      {dominantColor != null && (
        <View
          className="absolute inset-0"
          style={{ backgroundColor: `${dominantColor}0D` }}
        />
      )}
    </View>
  );
}
