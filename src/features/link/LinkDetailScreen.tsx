import { Stack, useLocalSearchParams } from "expo-router";
import { Ellipsis, Star } from "lucide-react-native";
import { View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { Heading } from "@/components/ui/heading/Heading";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";

export function LinkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              left={<HeaderBackButton />}
              right={
                <>
                  <IconButton iconNode={Star} accessibilityLabel="즐겨찾기" />
                  <IconButton iconNode={Ellipsis} accessibilityLabel="더보기" />
                </>
              }
            />
          ),
        }}
      />
      <View className="flex-1 items-center justify-center p-6">
        <Heading size="2xl">링크 상세</Heading>
        <Text className="mt-2 text-neutral-500">id: {id}</Text>
      </View>
    </>
  );
}
