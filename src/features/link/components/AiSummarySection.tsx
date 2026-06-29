import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ChevronIcon } from "@/components/ui/icon/ChevronIcon";
import { SparkleIcon } from "@/components/ui/icon/SparkleIcon";
import { Text } from "@/components/ui/text/Text";

const COLLAPSED_HEIGHT = 116;
// 카드 표면색 — rgba(255,255,255,0.05)(--color-opacity-white-05) 가
// --color-background-base(#0e0e13) 위에 깔린 결과를 미리 합성한 불투명 값.
// LinearGradient 는 className(반투명 배경 토큰)을 그대로 못 참조하고 실제 color 값이
// 필요해서, 화면 배경색이 아니라 "카드" 배경색 기준으로 하드코딩한다.
// "transparent" 키워드 대신 명시적 rgba(..., 0) 을 쓴다 — iOS 네이티브 컬러 파서가
// "transparent" 문자열을 못 받아 그라디언트가 깨지는 경우가 있어서(Android 는 정상).
const CARD_SURFACE_TRANSPARENT = "rgba(26, 26, 31, 0)";
const CARD_SURFACE_OPAQUE = "rgba(26, 26, 31, 1)";

export interface AiSummarySectionProps {
  summary: string;
}

export function AiSummarySection({ summary }: AiSummarySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View className="gap-4 rounded-[20px] bg-opacity-white-05 p-4">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => setIsExpanded((prev) => !prev)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-1.5">
          <SparkleIcon />
          <Text variant="heading-3">AI 요약으로 미리보기</Text>
        </View>
        <ChevronIcon rotated={!isExpanded} />
      </Pressable>
      <View
        className="relative"
        style={
          isExpanded
            ? undefined
            : { maxHeight: COLLAPSED_HEIGHT, overflow: "hidden" }
        }
      >
        <Text variant="body-2-reading">{summary}</Text>
        {!isExpanded && (
          // LinearGradient 는 서드파티 네이티브 컴포넌트라 className(NativeWind) 이
          // 아니라 style prop 으로 위치/크기를 줘야 한다(iOS 에서 className 미적용 확인됨).
          <LinearGradient
            pointerEvents="none"
            colors={[CARD_SURFACE_TRANSPARENT, CARD_SURFACE_OPAQUE]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 40,
            }}
          />
        )}
      </View>
    </View>
  );
}
