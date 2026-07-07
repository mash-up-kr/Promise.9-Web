import { Stack } from "expo-router";
import { View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";
import { SearchBar } from "@/features/search/components/SearchBar";

export function SearchScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header left={<HeaderBackButton />} title={<SearchBar />} />
          ),
        }}
      />
      <View className="flex-1 items-center justify-center p-6">
        <Heading size="2xl">검색</Heading>
        <Text className="mt-2 text-neutral-500">링크 검색 placeholder</Text>
      </View>
    </>
  );
}
