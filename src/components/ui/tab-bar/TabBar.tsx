import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Plus } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon/Icon";
import { usePressedScale } from "@/components/ui/icon-button/usePressedScale";
import { ROUTES } from "@/constants/routes.constants";
import { tv } from "@/lib/tv";

import {
  TabFolderGlyph,
  TabHomeGlyph,
  type TabGlyphProps,
} from "./TabBarGlyphs";

// Figma Tab Bar: 화면 하단 중앙 gray-700 솔리드 pill(h60·px16·gap12).
export const tabBarStyles = tv({
  base: "h-15 flex-row items-center gap-3 rounded-full bg-gray-700 px-4",
});

// Nav Tab Item: 44 원형. 선택 상태는 배경이 아니라 아이콘 채움 색으로만 표현한다.
export const tabItemStyles = tv({
  base: "size-11 items-center justify-center rounded-full",
});

// 활성 글리프는 노란 썸 위라 대비되는 inverse, 비활성은 시안 회색(assistive).
// svg fill 은 className 토큰을 받지 못해 raw 값으로 둔다(gray-950 · gray-400).
export const TAB_ICON_COLORS = {
  active: "#121212",
  inactive: "#65656b",
} as const;

// iOS 탭바처럼 선택 탭 뒤에서 미끄러져 이동하는 노란 썸.
export const tabThumbStyles = tv({
  base: "absolute top-2 size-11 rounded-full bg-yellow-300",
});

// 썸 x 좌표: pill 좌측 패딩(16) + [홈 44 + gap 12 + 플러스 40 + gap 12] = 124.
const THUMB_X = { home: 16, archive: 124 } as const;
const TAB_SWITCH_MS = 250;

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

  const thumbProgress = useSharedValue(activeRouteName === "archive" ? 1 : 0);

  useEffect(() => {
    thumbProgress.value = withTiming(activeRouteName === "archive" ? 1 : 0, {
      duration: TAB_SWITCH_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [activeRouteName, thumbProgress]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          THUMB_X.home + thumbProgress.value * (THUMB_X.archive - THUMB_X.home),
      },
    ],
  }));

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
      style={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      <View className={tabBarStyles()}>
        <Animated.View
          testID="tab-bar-thumb"
          pointerEvents="none"
          style={thumbStyle}
          className={tabThumbStyles({ class: "left-0" })}
        />
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

// 썸 이동과 같은 타이밍으로 inverse/assistive 두 레이어 아이콘의 opacity 를 교차 전환한다.
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

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, {
      duration: TAB_SWITCH_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [isActive, activeProgress]);

  const accentStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));
  const assistiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - activeProgress.value,
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
      <View className="size-6">
        <Animated.View style={assistiveStyle} className="absolute inset-0">
          <item.Glyph color={TAB_ICON_COLORS.inactive} />
        </Animated.View>
        <Animated.View style={accentStyle} className="absolute inset-0">
          <item.Glyph color={TAB_ICON_COLORS.active} />
        </Animated.View>
      </View>
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
