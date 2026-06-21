import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";

export function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Heading size="2xl">로그인</Heading>
      <Text className="mt-2 text-neutral-500">로그인 화면 placeholder</Text>
    </View>
  );
}
