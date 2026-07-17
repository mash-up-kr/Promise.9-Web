import { Tabs, useRouter } from "expo-router";
import { Search, Settings } from "lucide-react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";
import { Heading } from "@/components/ui/heading/Heading";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { TabBar } from "@/components/ui/tab-bar/TabBar";
import { ROUTES } from "@/constants/routes.constants";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        // 헤더는 투명 프로스트라 콘텐츠가 그 아래로 스크롤되게 한다(화면별 paddingTop=useHeaderHeight).
        headerTransparent: true,
        // 시스템 라이트 모드에서 투명 씬 아래 밝은 배경이 비치지 않게 다크로 칠한다.
        sceneStyle: { backgroundColor: "#0e0e13" },
        header: ({ options }) => (
          <Header title={options.title} right={<HeaderActions />} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          header: () => (
            <Header
              // 서비스 워드마크 로고(svg)가 확정되면 임시 텍스트를 로고로 교체 예정
              left={<Heading>Link-dingdong</Heading>}
              right={
                <>
                  <IconButton
                    iconNode={Search}
                    accessibilityLabel="검색"
                    onPress={() => router.navigate(ROUTES.SEARCH)}
                  />
                  <IconButton iconNode={Settings} accessibilityLabel="설정" />
                </>
              }
            />
          ),
        }}
      />
      <Tabs.Screen name="archive" options={{ title: "보관함" }} />
      <Tabs.Screen name="settings" options={{ title: "세팅" }} />
    </Tabs>
  );
}
