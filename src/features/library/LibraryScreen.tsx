import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";

export function LibraryScreen() {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Heading size="2xl">보관함</Heading>
      <Text className="mt-2 text-neutral-500">보관함 목록 placeholder</Text>
    </View>
  );
}
