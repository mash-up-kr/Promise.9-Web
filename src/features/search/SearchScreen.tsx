import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";

export function SearchScreen() {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Heading size="2xl">검색</Heading>
      <Text className="mt-2 text-neutral-500">링크 검색 placeholder</Text>
    </View>
  );
}
