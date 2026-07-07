import { Stack } from "expo-router";
import { Search } from "lucide-react-native";
import { View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { Heading } from "@/components/ui/heading/Heading";
import { IconButton } from "@/components/ui/icon-button/IconButton";
import { Text } from "@/components/ui/text/Text";

export function CategoriesScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              left={<HeaderBackButton />}
              title="카테고리"
              right={<IconButton iconNode={Search} accessibilityLabel="검색" />}
            />
          ),
        }}
      />
      <View className="flex-1 items-center justify-center p-6">
        <Heading size="2xl">카테고리 둘러보기</Heading>
        <Text className="mt-2 text-neutral-500">
          카테고리 그리드 placeholder
        </Text>
      </View>
    </>
  );
}
