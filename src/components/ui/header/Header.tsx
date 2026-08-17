import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Heading } from "@/components/ui/heading/Heading";
import { tv } from "@/lib/tv";

import { useHeaderHiddenOffset } from "./HeaderScrollProvider";

// Figma Header: 375(width-fill)×60, 배경은 base 솔리드 on/off — 링크 상세처럼
// 콘텐츠 위에 얹히는 화면만 off. 스크롤 트리거는 scrollScope + HeaderScrollProvider 로 연결한다.
export const HEADER_BAR_HEIGHT = 60;

/** 헤더가 차지하는 총 높이(safe-area top + 바). 화면 콘텐츠 상단 패딩에 쓴다. */
export function useHeaderHeight() {
  return useSafeAreaInsets().top + HEADER_BAR_HEIGHT;
}

// 배경은 status bar(safe-area) 뒤까지 같은 색이어야 해 바깥 컨테이너에 칠한다.
export const headerContainerStyles = tv({
  base: "",
  variants: {
    background: {
      true: "bg-background-base",
    },
  },
});

const headerStyles = tv({
  base: "h-15 flex-row items-center justify-between px-5",
});

export interface HeaderProps {
  left?: React.ReactNode;
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  /** false: 배경 없이 콘텐츠 위에 얹히는 헤더(링크 상세 전용). */
  background?: boolean;
  /** 스크롤 트리거 연결 키 — 화면의 useHeaderAwareScrollHandler(scope) 와 같은 값. */
  scrollScope?: string;
}

export function Header({
  left,
  title,
  right,
  className,
  background = true,
  scrollScope,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const hiddenOffset = useHeaderHiddenOffset(scrollScope);

  // 스크롤 트리거는 배경 있는 헤더에만 적용 — 배경 없는 헤더(링크 상세)는 항상 고정.
  const scrollAwayStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: background && hiddenOffset ? -hiddenOffset.value : 0 },
    ],
  }));

  return (
    <Animated.View
      style={[{ paddingTop: insets.top }, scrollAwayStyle]}
      className={headerContainerStyles({ background })}
    >
      <View className={headerStyles({ class: className })}>
        <View className="flex-1 flex-row items-center gap-4">
          {left}
          {typeof title === "string" ? <Heading>{title}</Heading> : title}
        </View>

        <View className="flex-row items-center justify-end gap-2.5">
          {right}
        </View>
      </View>
    </Animated.View>
  );
}
