import { Tabs, useRouter } from "expo-router";
import { Search, Settings } from "lucide-react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";
import { Heading } from "@/components/ui/heading/Heading";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { TabBar } from "@/components/ui/tab-bar/TabBar";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: "transparent" },
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
                    onPress={() => router.navigate("/search")}
                  />
                  <IconButton iconNode={Settings} accessibilityLabel="설정" />
                </>
              }
            />
          ),
        }}
      />
      {/* 보관함은 화면이 자체 Header(더보기 메뉴 포함)를 렌더하므로 탭 헤더는 끈다. */}
      <Tabs.Screen
        name="archive"
        options={{ title: "보관함", headerShown: false }}
      />
      <Tabs.Screen name="settings" options={{ title: "세팅" }} />
    </Tabs>
  );
}
