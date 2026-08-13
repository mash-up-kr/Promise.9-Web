import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Archive, House, Plus } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { usePressedScale } from "@/components/ui/icon-button/usePressedScale";
import { ROUTES } from "@/constants/routes.constants";
import { tv } from "@/lib/tv";

// Figma Tab Bar: 화면 하단 중앙 gray-700 솔리드 pill(h60·px16·gap12).
export const tabBarStyles = tv({
  base: "h-15 flex-row items-center gap-3 rounded-full bg-gray-700 px-4",
});

// Nav Tab Item: 44 원형. 선택 상태는 배경이 아니라 아이콘 채움 색으로만 표현한다.
export const tabItemStyles = tv({
  base: "size-11 items-center justify-center rounded-full",
});

export const tabIconStyles = tv({
  variants: {
    isActive: {
      true: "text-icon-accent",
      false: "text-icon-assistive",
    },
  },
});

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
  iconNode: IconComponent;
};

// 디자인상 탭은 홈·보관함 2개. 검색·세팅 라우트는 헤더 아이콘으로 진입한다.
const HOME_TAB: TabItemConfig = { name: "index", label: "홈", iconNode: House };
const ARCHIVE_TAB: TabItemConfig = {
  name: "archive",
  label: "보관함",
  iconNode: Archive,
};

// 선택 전환 시 노란 채움이 이전 탭에서 빠져나가 새 탭으로 옮겨가는 것처럼 보이도록,
// accent/assistive 두 레이어의 아이콘을 겹쳐 두고 opacity 를 교차 전환한다.
const TAB_SWITCH_MS = 250;

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
          <Icon
            iconNode={item.iconNode}
            size={24}
            strokeWidth={1.5}
            // 시안 탭 아이콘은 filled 글리프 — lucide 채움 방식(FolderIcon 선례)으로 근사한다.
            fill="currentColor"
            className={tabIconStyles({ isActive: false })}
          />
        </Animated.View>
        <Animated.View style={accentStyle} className="absolute inset-0">
          <Icon
            iconNode={item.iconNode}
            size={24}
            strokeWidth={1.5}
            fill="currentColor"
            className={tabIconStyles({ isActive: true })}
          />
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
