import { Link } from "expo-router";
import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";

export function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Heading size="2xl">세팅</Heading>
      <Text className="mt-2 text-neutral-500">세팅 placeholder</Text>
      <Link href="/link/link-1" className="mt-6 text-blue-400">
        링크 상세 화면 확인 (mock)
      </Link>
    </View>
  );
}
