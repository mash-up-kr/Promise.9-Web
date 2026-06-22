import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="search" options={{ title: "검색" }} />
      <Tabs.Screen name="library" options={{ title: "보관함" }} />
      <Tabs.Screen name="settings" options={{ title: "세팅" }} />
    </Tabs>
  );
}
