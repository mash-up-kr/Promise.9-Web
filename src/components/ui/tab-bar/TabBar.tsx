import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Archive, House, Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/components/ui/glass-view/GlassView";
import { Icon, type IconComponent } from "@/components/ui/icon/Icon";
import { ROUTES } from "@/constants/routes.constants";
import { tv } from "@/lib/tv";

// 디자인 시스템 Tab Bar: 화면 하단 중앙에 뜨는 pill.
// Figma: rgba(36,36,38,0.7) + blur(15) 유리 + inset 하이라이트. blur+bg 와 하이라이트를
// 분리 레이어로 쌓는다(하이라이트가 blur 위에 보이게).
const tabBarStyles = tv({
  base: "h-15 flex-row items-center gap-2 overflow-hidden rounded-full px-2",
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
        <GlassView intensity={80} className="absolute inset-0" />
        <View
          pointerEvents="none"
          className="absolute inset-0 rounded-full shadow-[inset_1px_1px_0_0_var(--color-opacity-white-10)]"
        />
        <TabBarItem
          item={HOME_TAB}
          isActive={activeRouteName === HOME_TAB.name}
          onPress={() => handleTabPress(HOME_TAB.name)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="링크 추가"
          // push 는 연타 시 시트가 중복으로 쌓여 navigate 로 멱등하게 이동한다.
          onPress={() => router.navigate(ROUTES.CREATE_LINK)}
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
