import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/components/ui/glass-view/GlassView";
import { Heading } from "@/components/ui/heading/Heading";
import { tv } from "@/lib/tv";

// Figma 헤더: 투명 바 + 배경블러(홈 8px). 콘텐츠가 헤더 아래로 스크롤되며 프로스트된다.
// (headerTransparent + 화면 콘텐츠 paddingTop = useHeaderHeight 조합. React Navigation 의
//  useHeaderHeight 는 expo SDK 56 에서 deprecated 라 안전영역 + 고정 바 높이로 직접 계산한다.)
export const HEADER_BAR_HEIGHT = 60;

/** 헤더가 차지하는 총 높이(safe-area top + 바). 화면 콘텐츠 상단 패딩에 쓴다. */
export function useHeaderHeight() {
  return useSafeAreaInsets().top + HEADER_BAR_HEIGHT;
}

const headerStyles = tv({
  base: "h-15 flex-row items-center justify-between px-5",
});

// Figma: 표준 헤더는 Blur/8, dim(검색) 헤더는 HeaderBackground = blur30 + rgba(14,14,19,0.88)
// 88% 다크딤. expo-blur intensity 로 근사한다(blur = intensity×0.2, 웹 상한 20px, 색은 tint).
const HEADER_BLUR_INTENSITY = { standard: 40, dim: 100 } as const;

// plain: 배경색 없음 — 링크상세처럼 이미지 위에 헤더가 떠서 아이콘 버튼만 보이는 경우.
export type HeaderVariant = keyof typeof HEADER_BLUR_INTENSITY | "plain";

export interface HeaderProps {
  left?: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  /** dim: 강한 다크딤(검색). plain: 배경 없음(링크상세). 기본은 표준 프로스트. */
  variant?: HeaderVariant;
}

export function Header({
  left,
  title,
  right,
  className,
  variant = "standard",
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      {variant !== "plain" && (
        <GlassView
          intensity={HEADER_BLUR_INTENSITY[variant]}
          className="absolute inset-0"
        />
      )}
      <View className={headerStyles({ class: className })}>
        <View className="flex-1 flex-row items-center gap-4">
          {left}
          {typeof title === "string" ? <Heading>{title}</Heading> : title}
        </View>

        <View className="flex-row items-center justify-end gap-2.5">
          {right}
        </View>
      </View>
    </View>
  );
}
