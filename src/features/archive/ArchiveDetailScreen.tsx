import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";

export function ArchiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Heading size="2xl">보관함 상세</Heading>
      <Text className="mt-2 text-neutral-500">id: {id}</Text>
    </View>
  );
}
