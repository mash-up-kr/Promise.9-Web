import { Stack } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { Markdown } from "@/components/ui/markdown/Markdown";

import { SUPPORT_MD } from "./support.content";

export function SupportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background-base">
      {/* 화면이 자체 헤더를 렌더하므로 네이티브 스택 헤더는 숨긴다(LegalScreen 선례). */}
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="고객지원" left={<HeaderBackButton />} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          className="px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <Markdown>{SUPPORT_MD}</Markdown>
        </View>
      </ScrollView>
    </View>
  );
}
