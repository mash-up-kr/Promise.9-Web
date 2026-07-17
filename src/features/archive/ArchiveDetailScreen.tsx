import { Stack, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { Header } from "@/components/ui/header/Header";
import { HeaderActions } from "@/components/ui/header/HeaderActions";
import { HeaderBackButton } from "@/components/ui/header/HeaderBackButton";
import { LinkTile } from "@/components/ui/link-card/LinkTile";

import { FOLDER_LINKS } from "./archive.mocks";

export function ArchiveDetailScreen() {
  const router = useRouter();

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
      <ScrollView
        className="flex-1 bg-background-base"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between gap-y-5 px-5 pt-2 pb-6">
          {FOLDER_LINKS.map((link) => (
            <LinkTile
              key={link.linkId}
              link={link}
              onPress={() =>
                router.push({
                  pathname: "/link/[id]",
                  params: { id: String(link.linkId) },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </>
  );
}
