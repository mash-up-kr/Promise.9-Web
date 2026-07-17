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

export interface HeaderProps {
  left?: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function Header({ left, title, right, className }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <GlassView intensity={40} className="absolute inset-0" />
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
