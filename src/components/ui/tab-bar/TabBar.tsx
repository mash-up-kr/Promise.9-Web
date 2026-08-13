import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Plus } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon/Icon";
import { usePressedScale } from "@/components/ui/icon-button/usePressedScale";
import { ROUTES } from "@/constants/routes.constants";
import { tv } from "@/lib/tv";

import {
  TabFolderGlyph,
  type TabGlyphProps,
  TabHomeGlyph,
} from "./TabBarGlyphs";

// Figma Tab Bar: 화면 하단 중앙 gray-700 솔리드 pill(h60·px16·gap12).
export const tabBarStyles = tv({
  base: "h-15 flex-row items-center gap-3 rounded-full bg-gray-700 px-4",
});

// Nav Tab Item: 44 원형. 선택 상태는 배경이 아니라 아이콘 채움 색으로만 표현한다.
export const tabItemStyles = tv({
  base: "size-11 items-center justify-center rounded-full",
});

// 시안 그대로 — 선택 글리프는 yellow-300 채움, 비선택은 assistive 회색.
// svg fill 은 className 토큰을 받지 못해 raw 값으로 둔다(yellow-300 · gray-400).
export const TAB_ICON_COLORS = {
  active: "#fffe66",
  inactive: "#65656b",
} as const;

const TAB_FADE_MS = 200;

// Nav Tab Item / Save Sheet: 40 원형 gray-500 + 흰색 plus 고정.
// 누르는 동안은 IconButton 인터랙션(배경 한 단계 밝게 + scale)을 따른다.
export const plusButtonStyles = tv({
  base: "size-10 items-center justify-center rounded-full",
  variants: {
    isPressed: {
      true: "bg-gray-400",
      false: "bg-gray-500",
    },
  },
  defaultVariants: {
    isPressed: false,
  },
});

export interface TabBarProps extends BottomTabBarProps {}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeRouteName = state.routes[state.index]?.name;

  const handleTabPress = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) {
      return;
    }
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (activeRouteName !== name && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <View className={tabBarStyles()}>
        <TabBarItem
          item={HOME_TAB}
          isActive={activeRouteName === HOME_TAB.name}
          onPress={() => handleTabPress(HOME_TAB.name)}
        />
        <PlusButton onPress={() => router.navigate(ROUTES.CREATE_LINK)} />
        <TabBarItem
          item={ARCHIVE_TAB}
          isActive={activeRouteName === ARCHIVE_TAB.name}
          onPress={() => handleTabPress(ARCHIVE_TAB.name)}
        />
      </View>
    </View>
  );
}

// =============================================

type TabItemConfig = {
  name: string;
  label: string;
  Glyph: React.ComponentType<TabGlyphProps>;
};

// 디자인상 탭은 홈·보관함 2개. 검색·세팅 라우트는 헤더 아이콘으로 진입한다.
const HOME_TAB: TabItemConfig = {
  name: "index",
  label: "홈",
  Glyph: TabHomeGlyph,
};
const ARCHIVE_TAB: TabItemConfig = {
  name: "archive",
  label: "보관함",
  Glyph: TabFolderGlyph,
};

// 선택되면 회색↔노랑 크로스페이드와 함께 아이콘이 볼록 튄다(1→1.14→1).
// 앱 시작 시(마운트) 초기 활성 탭에는 팝을 재생하지 않는다.
function TabBarItem({
  item,
  isActive,
  onPress,
}: {
  item: TabItemConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const activeProgress = useSharedValue(isActive ? 1 : 0);
  const popScale = useSharedValue(1);
  const isMountedRef = useRef(false);

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, {
      duration: TAB_FADE_MS,
      easing: Easing.out(Easing.ease),
    });
    if (isActive && isMountedRef.current) {
      popScale.value = withSequence(
        withTiming(1.14, { duration: 90, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 110, easing: Easing.out(Easing.ease) }),
      );
    } else {
      // 클린업이 팝 시퀀스를 중간에 취소한 경우를 대비해 원래 크기로 복원한다.
      popScale.value = 1;
    }
    isMountedRef.current = true;

    // 언마운트 시 진행 중인 애니메이션을 UI 스레드에서 정리한다.
    return () => {
      cancelAnimation(activeProgress);
      cancelAnimation(popScale);
    };
  }, [isActive, activeProgress, popScale]);

  const accentStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));
  const assistiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - activeProgress.value,
  }));
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popScale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      aria-selected={isActive}
      onPress={onPress}
      className={tabItemStyles()}
    >
      <Animated.View style={popStyle} className="size-6">
        <Animated.View style={assistiveStyle} className="absolute inset-0">
          <item.Glyph color={TAB_ICON_COLORS.inactive} />
        </Animated.View>
        <Animated.View style={accentStyle} className="absolute inset-0">
          <item.Glyph color={TAB_ICON_COLORS.active} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function PlusButton({ onPress }: { onPress: () => void }) {
  const { isPressed, pressedScaleStyle, handlePressIn, handlePressOut } =
    usePressedScale();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="링크 추가"
      // push 는 연타 시 시트가 중복으로 쌓여 navigate 로 멱등하게 이동한다.
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={pressedScaleStyle}
        className={plusButtonStyles({ isPressed })}
      >
        <Icon
          iconNode={Plus}
          size={24}
          strokeWidth={2}
          className="text-icon-strong"
        />
      </Animated.View>
    </Pressable>
  );
}
