import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkle } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { ChevronIcon } from "@/components/ui/icon/ChevronIcon";
import { Icon } from "@/components/ui/icon/Icon";
import { Text } from "@/components/ui/text/Text";

const COLLAPSED_HEIGHT = 116;
const FADE_HEIGHT = 40;
// 마스크는 흰색(불투명) = 보임, 투명 = 안 보임. 텍스트 자체의 알파를 줄이는 방식이라
// 뒤에 어떤 배경(이미지 대표색 기반 동적 배경 등)이 와도 항상 맞는다 — 배경색을 추정해
// 같은 색 사각형을 덮어 칠하던 이전 방식(CARD_SURFACE_*)은 동적 배경에서 단차가 생겨 폐기.
const MASK_FADE_START = 1 - FADE_HEIGHT / COLLAPSED_HEIGHT;
// 웹은 @react-native-masked-view 의 웹 구현이 children 을 렌더하지 않는 빈
// 스텁이라(maskElement 만 그림) 못 쓰고, CSS bg-clip-text 그라디언트로 대체한다.
// 클래스명은 Tailwind JIT 스캐너가 정적으로 읽어야 해서 리터럴 문자열로 둔다
// (변수 보간 시 인식 못 해 유틸리티가 생성되지 않음) — #e9e9eb = --color-text-normal.

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
          {/* fill 은 Icon 의 className→color 매핑 대상이 아니라 토큰 값을 리터럴로 맞춰준다 */}
          <Icon
            iconNode={Sparkle}
            size={14}
            className="text-icon-accent"
            fill="#0093FF"
          />
          <Text variant="heading-3">AI 요약으로 미리보기</Text>
        </View>
        <ChevronIcon rotated={!isExpanded} />
      </Pressable>
      {isExpanded ? (
        <Text variant="body-2-reading">{summary}</Text>
      ) : Platform.OS === "web" ? (
        <Text
          variant="body-2-reading"
          className="bg-linear-to-b from-[#e9e9eb] to-transparent bg-clip-text text-transparent"
          style={{ maxHeight: COLLAPSED_HEIGHT, overflow: "hidden" }}
        >
          {summary}
        </Text>
      ) : (
        <MaskedView
          style={{ maxHeight: COLLAPSED_HEIGHT, overflow: "hidden" }}
          maskElement={
            <LinearGradient
              colors={["white", "white", "transparent"]}
              locations={[0, MASK_FADE_START, 1]}
              style={{ flex: 1 }}
            />
          }
        >
          <Text variant="body-2-reading">{summary}</Text>
        </MaskedView>
      )}
    </View>
  );
}
