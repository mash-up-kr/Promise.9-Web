import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Archive, House, Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { tv } from "@/lib/tv";

// 디자인 시스템 Tab Bar: 화면 하단 중앙에 뜨는 pill.
// backdrop blur(15)는 네이티브 미지원이라 70% 불투명 배경으로 근사하고 웹에서만 적용한다.
const tabBarStyles = tv({
  base: "h-15 flex-row items-center gap-2 rounded-full px-2 bg-[rgba(36,36,38,0.7)] shadow-[inset_1px_1px_0_0_var(--color-opacity-white-10)] web:backdrop-blur-[15px]",
});

export interface TabBarProps extends BottomTabBarProps {}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
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
        {/* 링크 추가 화면이 생기면 onPress 를 연결한다 */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="링크 추가"
          className={tabItemStyles()}
        >
          <Icon
            iconNode={Plus}
            size={24}
            strokeWidth={1.5}
            className="text-icon-alternative"
          />
        </Pressable>
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

const tabItemStyles = tv({
  base: "size-11 items-center justify-center rounded-full",
  variants: {
    isActive: {
      true: "bg-opacity-white-20",
    },
  },
});

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

function TabBarItem({
  item,
  isActive,
  onPress,
}: {
  item: TabItemConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      aria-selected={isActive}
      onPress={onPress}
      className={tabItemStyles({ isActive })}
    >
      <Icon
        iconNode={item.iconNode}
        size={24}
        strokeWidth={1.5}
        className={isActive ? "text-icon-strong" : "text-icon-alternative"}
      />
    </Pressable>
  );
}
