import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { Heading } from "@/components/ui/heading/Heading";
import { Text } from "@/components/ui/text/Text";

export function ArchiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Header
              left={<HeaderBackButton />}
              // 타이틀은 보관함(폴더) 명칭 — 데이터 연동 전까지 기본 폴더명 표시
              title="전체"
              right={<HeaderActions />}
            />
          ),
        }}
      />
      <View className="flex-1 items-center justify-center bg-background-base p-6">
        <Heading size="2xl">보관함 상세</Heading>
        <Text className="mt-2 text-neutral-500">id: {id}</Text>
      </View>
    </>
  );
}
