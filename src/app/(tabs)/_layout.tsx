import { Tabs } from "expo-router";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: "transparent" },
        header: ({ options }) => (
          <Header title={options.title} right={<HeaderActions />} />
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="search" options={{ title: "검색" }} />
      <Tabs.Screen name="library" options={{ title: "보관함" }} />
      <Tabs.Screen name="settings" options={{ title: "세팅" }} />
    </Tabs>
  );
}
