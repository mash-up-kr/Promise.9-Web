import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";

export function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Heading size="2xl">세팅</Heading>
      <Text className="mt-2 text-neutral-500">세팅 placeholder</Text>
    </View>
  );
}
